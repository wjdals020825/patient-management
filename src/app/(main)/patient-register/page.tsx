"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button, Card, Table, Spinner, Pagination } from "react-bootstrap";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../context/AuthContext"; // ✅ 로그인 정보 사용 (hospitalId 포함)

interface Patient {
  id: string;
  chartNo: string;
  name: string;
  rrn: string;
  birth: string;
  gender: string;
  phone: string;
  firstVisit: string;
  hospitalId: string;
  createdAt: Date;
  age?: string;
}

function formatDateK(date: Date): string {
  return date
    .toLocaleDateString("ko-KR")
    .replace(/\. /g, "-")
    .replace(".", "");
}

// ✅ 생년월일(YYMMDD)을 정렬용 숫자로 변환
function getBirthSortValue(birth: string): number {
  if (!birth || birth.length < 6) return 0;

  const yy = parseInt(birth.substring(0, 2), 10);
  const mm = parseInt(birth.substring(2, 4), 10);
  const dd = parseInt(birth.substring(4, 6), 10);

  if (Number.isNaN(yy) || Number.isNaN(mm) || Number.isNaN(dd)) return 0;

  const currentYear = new Date().getFullYear();
  const currentYY = Number(String(currentYear).slice(2));

  const fullYear = yy <= currentYY ? 2000 + yy : 1900 + yy;

  return fullYear * 10000 + mm * 100 + dd;
}

export default function PatientRegisterPage() {
  const { user } = useAuth(); // ✅ 로그인된 관리자 정보 (hospitalId 포함)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ✅ 업로드 미리보기 여부
  const [isPreview, setIsPreview] = useState(false);

  // ✅ 정렬 상태 (일반 리스트일 때만 사용)
  const [sortKey, setSortKey] = useState<"name" | "chartNo" | "birth" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10; 

  // ✅ 엑셀 양식 다운로드
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 차트번호: "", 이름: "", 주민번호: "000000-0", 전화번호: ""},
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "양식");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "환자등록_양식.xlsx");
  };

  // ✅ 주민번호 → 성별 변환
  const getGender = (idPart: string) => {
    const genderCode = idPart.charAt(0);
    if (["1", "3", "5", "7"].includes(genderCode)) return "남";
    if (["2", "4", "6", "8"].includes(genderCode)) return "여";
    return "기타";
  };

  // ✅ 엑셀 업로드 → State 저장
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const formattedData: Patient[] = parsedData.map((row) => {
        const rrn = row["주민번호"]?.replace(/[^0-9]/g, "") ?? "";
        const birth = rrn.substring(0, 6);
        const gender = rrn.length >= 7 ? getGender(rrn.charAt(6)) : "알수없음";

const firstVisit = formatDateK(new Date()) ;

        return {
          id: uuidv4(),
          chartNo: row["차트번호"] ?? "",
          name: row["이름"] ?? "",
          rrn,
          birth,
          gender,
          phone: row["전화번호"] ?? "",
          firstVisit: firstVisit,
          hospitalId: user?.hospitalId ?? "unknown",
          createdAt: new Date(),
        };
      });

      setPatients(formattedData);
      setIsPreview(true); // ✅ 업로드 미리보기 모드 켜기
      setSortKey(null);   // ✅ 미리보기 모드에서는 정렬 상태 초기화
    };

    reader.readAsBinaryString(file);
  };
// ✅ Firestore 저장 (중복 제거 포함)
const handleSaveToFirestore = async () => {
  if (patients.length === 0) {
    alert("등록할 환자 데이터가 없습니다.");
    return;
  }
  if (!user?.hospitalId) {
    alert("로그인 정보에 hospitalId가 없습니다.");
    return;
  }

  setUploading(true);
  try {
    let insertedCount = 0;
    let skippedCount = 0;

    for (const p of patients) {
      // 이름 + 생년월일 + 전화번호 기준으로 중복 체크
      // (이 세 값이 모두 같은 환자가 이미 있으면 저장하지 않음)
      const dupQuery = query(
        collection(db, "PatientList"),
        where("hospitalId", "==", user.hospitalId),
        where("name", "==", p.name),
        where("birth", "==", p.birth),
        where("phone", "==", p.phone)
      );

      const dupSnapshot = await getDocs(dupQuery);

      if (dupSnapshot.empty) {
        // ✅ 중복 아님 → 새로 저장
        await addDoc(collection(db, "PatientList"), {
          ...p,
          hospitalId: user.hospitalId,
          createdAt: new Date(),
        });
        insertedCount++;
      } else {
        // ⚠️ 이미 같은 사람 있음 → 스킵
        skippedCount++;
      }
    }

    alert(
      `✅ 저장 완료!\n새로 등록: ${insertedCount}명\n중복으로 제외: ${skippedCount}명`
    );

    // 저장 후 상태 초기화 + 리스트 다시 불러오기
    setPatients([]);
    setIsPreview(false);
    // 정렬 상태를 쓰고 있다면 초기화 유지
    // setSortKey(null);  // 정렬 기능 쓰는 버전이면 이미 이 줄 있을 거야

    fetchPatients();

    // ✅ 파일 input 초기화
    const fileInput = document.getElementById("excelFile") as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ 저장 중 오류가 발생했습니다.");
  } finally {
    setUploading(false);
  }
};


 // ✅ Firestore에서 전체 환자 목록 불러오기 (createdAt 기준 최신순 정렬)
const fetchPatients = async () => {
  if (!user?.hospitalId) return;
  setLoading(true);

  try {
    const q = query(
      collection(db, "PatientList"),
      where("hospitalId", "==", user.hospitalId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      ...(doc.data() as Patient),
      id: doc.id,
    }));

    setPatients(data);
    setCurrentPage(1); // 첫 페이지로 이동
  } catch (err) {
    console.error("데이터 불러오기 오류:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchPatients();
  }, [user?.hospitalId]);

  // ✅ 헤더 클릭 시 정렬 변경
const handleSort = (key: "name" | "chartNo" | "birth" ) => {
  if (isPreview) return; // 미리보기 모드에서는 정렬 X

  // 같은 컬럼을 다시 클릭하면 asc ↔ desc 토글
  if (sortKey === key) {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  } else {
    // 다른 컬럼을 클릭하면 해당 컬럼 기준으로 오름차순부터 시작
    setSortKey(key);
    setSortOrder("asc");
  }
};

  // ✅ 실제 화면에 보여줄 환자 목록 (정렬 적용)
  const displayedPatients = useMemo(() => {
    // 미리보기 모드일 때는 업로드한 그대로 보여줌
    if (isPreview || !sortKey) return patients;

    const cloned = [...patients];

    if (sortKey === "name") {
      cloned.sort((a, b) => {
        const aName = a.name ?? "";
        const bName = b.name ?? "";
        return sortOrder === "asc"
          ? aName.localeCompare(bName, "ko")
          : bName.localeCompare(aName, "ko");
      });
    } else if (sortKey === "chartNo") {
      cloned.sort((a, b) => {
        const aNo = Number(a.chartNo ?? 0);
        const bNo = Number(b.chartNo ?? 0);
        return sortOrder === "asc" ? aNo - bNo : bNo - aNo;
      });
    } else if (sortKey === "birth") {
      cloned.sort((a, b) => {
        const aVal = getBirthSortValue(a.birth ?? "");
        const bVal = getBirthSortValue(b.birth ?? "");
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return cloned;
  }, [patients, isPreview, sortKey, sortOrder]);
  // ✅ 실제 테이블에 렌더링할 데이터: 정렬된 리스트에서 현재 페이지 10개만
const paginatedPatients = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return displayedPatients.slice(startIndex, endIndex);
}, [displayedPatients, currentPage, itemsPerPage]);

// ✅ 전체 페이지 수
const totalPages = Math.ceil(displayedPatients.length / itemsPerPage);

// ✅ 한 번에 10개 페이지 번호만 보여주기
const pageNumbers = useMemo(() => {
  if (totalPages === 0) return [];

  const blockSize = 10; // 한 번에 보여줄 페이지 번호 개수
  const currentBlock = Math.floor((currentPage - 1) / blockSize);
  const startPage = currentBlock * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);

  const numbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    numbers.push(i);
  }
  return numbers;
}, [currentPage, totalPages]);


  return (
    <div className="container mt-5">
      <h2 className="mb-4 fw-bold">환자 등록 및 조회</h2>

      {/* ✅ 업로드 영역 */}
      <Card className="p-4 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h5>📂 엑셀 업로드</h5>
            <p className="text-muted small mb-2">
              차트번호 / 이름 / 주민번호(앞6자리+뒤1자리) / 전화번호 / 초진일자
            </p>
            <input
              id="excelFile" // ✅ 파일 input에 id 추가
              type="file"
              accept=".xlsx, .xls"
              onChange={handleUpload}
            />
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={handleDownloadTemplate}>
              엑셀 양식 다운로드
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveToFirestore}
              disabled={uploading || patients.length === 0}
            >
              {uploading ? <Spinner animation="border" size="sm" /> : "Firestore 저장"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ✅ 리스트 영역 */}
      <Card className="p-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold">
            {isPreview ? "📋 업로드 내용 미리보기" : "📋 환자 목록"}
          </h5>
   
        </div>

        {patients.length === 0 ? (
          <p className="text-muted text-center py-4">등록된 환자가 없습니다.</p>
        ) : (
          <Table bordered hover responsive>
            <thead className="table-light">
              <tr className="text-center">
                <th
                  onClick={() => handleSort("chartNo")}
                  style={{ cursor: isPreview ? "default" : "pointer" }}
                >
                  차트번호{" "}
                  {!isPreview && sortKey === "chartNo" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ cursor: isPreview ? "default" : "pointer" }}
                >
                  이름{" "}
                  {!isPreview && sortKey === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("birth")}
                  style={{ cursor: isPreview ? "default" : "pointer" }}
                >
                  생년월일{" "}
                  {!isPreview && sortKey === "birth" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th>나이</th>
                <th>성별</th>
                <th>전화번호</th>
                <th>초진일자</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPatients.map((p) => {
                // 생년 2자리만 추출
                const birthYear = parseInt(p.birth.substring(0, 2), 10);

                // 현재 연도 가져오기
                const currentYear = new Date().getFullYear();

                // 2000년대인지 1900년대인지 판단
                const fullYear =
                  birthYear <= Number(String(currentYear).slice(2))
                    ? 2000 + birthYear
                    : 1900 + birthYear;

                // 한국식 나이 (만 나이로 하려면 +1 제거)
                const age =
                  !Number.isNaN(birthYear) && !Number.isNaN(fullYear)
                    ? currentYear - fullYear + 1 + "세"
                    : "-";

                return (
                  <tr key={p.id} className="text-center">
                    <td>{p.chartNo}</td>
                    <td>{p.name}</td>
                    <td>{p.birth}</td>
                    <td>{age}</td>
                    <td>{p.gender}</td>
                    <td>{p.phone}</td>
                    <td>{p.firstVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

     <div className="d-flex justify-content-center mt-3">
  <Pagination>
    {/* 처음 페이지로 */}
    <Pagination.First
      onClick={() => setCurrentPage(1)}
      disabled={currentPage === 1 || totalPages === 0}
    />

    {/* 이전 페이지 */}
    <Pagination.Prev
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1 || totalPages === 0}
    />

    {/* 가운데 페이지 번호들 (최대 10개) */}
    {pageNumbers.map((page) => (
      <Pagination.Item
        key={page}
        active={page === currentPage}
        onClick={() => setCurrentPage(page)}
      >
        {page}
      </Pagination.Item>
    ))}

    {/* 다음 페이지 */}
    <Pagination.Next
      onClick={() =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
      }
      disabled={currentPage === totalPages || totalPages === 0}
    />

    {/* 마지막 페이지로 */}
    <Pagination.Last
      onClick={() => setCurrentPage(totalPages)}
      disabled={currentPage === totalPages || totalPages === 0}
    />
  </Pagination>
</div>

    </div>
  );
}
