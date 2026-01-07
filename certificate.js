export async function generateCertificate() {
  const data = JSON.parse(localStorage.getItem("student_data"));
  if (!data || !data.studentName) return alert("Fill form first!");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [800, 600] });
  const img = new Image();
  img.src = "certificate.png"; 

  img.onload = function () {
    doc.addImage(img, "PNG", 0, 0, 800, 600);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(40);
    doc.text(data.studentName, 400, 390, { align: "center" });
    doc.save(`${data.studentName}_Certificate.pdf`);
  };
  img.onerror = () => alert("Error: certificate.png not found!");
}