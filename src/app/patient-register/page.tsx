"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button, Card, Table, Spinner, Pagination } from "react-bootstrap";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, getDocs, query, where, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext"; // ✅ 로그인 정보 사용 (hospitalId 포함)

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
}

export default function PatientRegisterPage() {
  const { user } = useAuth(); // ✅ 로그인된 관리자 정보 (hospitalId 포함)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ 엑셀 양식 다운로드
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 차트번호: "", 이름: "", 주민번호: "000000-0", 전화번호: "", 초진일자: "" },
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

        return {
          id: uuidv4(),
          chartNo: row["차트번호"] ?? "",
          name: row["이름"] ?? "",
          rrn,
          birth,
          gender,
          phone: row["전화번호"] ?? "",
          firstVisit: row["초진일자"] ?? "",
          hospitalId: user?.hospitalId ?? "unknown",
          createdAt: new Date(),
        };
      });

      setPatients(formattedData);
    };

    reader.readAsBinaryString(file);
  };

  // ✅ Firestore 저장
  const handleSaveToFirestore = async () => {
    if (patients.length === 0) return alert("등록할 환자 데이터가 없습니다.");
    if (!user?.hospitalId) return alert("로그인 정보에 hospitalId가 없습니다.");

    setUploading(true);
    try {
      const batchPromises = patients.map((p) =>
        addDoc(collection(db, "PatientList"), {
          ...p,
          hospitalId: user.hospitalId,
          createdAt: new Date(),
        })
      );
      await Promise.all(batchPromises);
      alert("✅ 환자 데이터가 성공적으로 저장되었습니다!");
      setPatients([]);
      fetchPatients(); // 저장 후 새로고침
    } catch (err) {
      console.error(err);
      alert("⚠️ 저장 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Firestore에서 환자 목록 불러오기 (10명씩)
  const fetchPatients = async (nextPage = false) => {
    if (!user?.hospitalId) return;
    setLoading(true);

    try {
      let q = query(
        collection(db, "PatientList"),
        where("hospitalId", "==", user.hospitalId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      if (nextPage && lastDoc) {
        q = query(
          collection(db, "PatientList"),
          where("hospitalId", "==", user.hospitalId),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        ...(doc.data() as Patient),
        id: doc.id,
      }));

      if (nextPage) {
        setPatients((prev) => [...prev, ...data]);
        setCurrentPage((prev) => prev + 1);
      } else {
        setPatients(data);
        setCurrentPage(1);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error("데이터 불러오기 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user?.hospitalId]);

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
            <input type="file" accept=".xlsx, .xls" onChange={handleUpload} />
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
          <h5 className="fw-semibold">📋 내 병원 환자 목록</h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => fetchPatients(true)}
            disabled={loading}
          >
          </Button>
        </div>

        {patients.length === 0 ? (
          <p className="text-muted text-center py-4">등록된 환자가 없습니다.</p>
        ) : (
          <Table bordered hover responsive>
            <thead className="table-light">
              <tr className="text-center">
                <th>차트번호</th>
                <th>이름</th>
                <th>생년월일</th>
                <th>성별</th>
                <th>전화번호</th>
                <th>초진일자</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="text-center">
                  <td>{p.chartNo}</td>
                  <td>{p.name}</td>
                  <td>{p.birth}</td>
                  <td>{p.gender}</td>
                  <td>{p.phone}</td>
                  <td>{p.firstVisit}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ✅ Pagination Info */}
      <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.Item active>{currentPage}</Pagination.Item>
          {patients.length >= 10 && (
            <Pagination.Next onClick={() => fetchPatients(true)} disabled={loading}>
              다음
            </Pagination.Next>
          )}
        </Pagination>
      </div>
    </div>
  );
}
