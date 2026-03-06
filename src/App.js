import React, { useState, useEffect, useRef } from "react";
import mondaySdk from "monday-sdk-js";
import html2pdf from "html2pdf.js";

const monday = mondaySdk();

function App() {
  const [context, setContext] = useState(null);
  const [subitems, setSubitems] = useState([]);
  const [parentItem, setParentItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const contentRef = useRef();

  useEffect(() => {
    monday.listen("context", (res) => {
      setContext(res.data);
      if (res.data.itemId) {
        fetchSubitems(res.data.itemId);
      }
    });
  }, []);

  const fetchSubitems = (itemId) => {
    // UPDATED QUERY: Added fragment to support FormulaValue display_value
    monday.api(`query { 
      items (ids: ${itemId}) { 
        name
        column_values { 
          id 
          text 
          ... on FormulaValue {
            display_value
          }
        }
        subitems { 
          name 
          column_values { 
            id 
            text 
            ... on FormulaValue {
              display_value
            }
          } 
        } 
      } 
    }`).then((res) => {
      if (res.data.items[0]) {
        setParentItem(res.data.items[0]);
        setSubitems(res.data.items[0].subitems);
      }
      setLoading(false);
    });
  };

  const getCol = (item, columnId) => {
    if (!item || !item.column_values) return "";
    const column = item.column_values.find(c => c.id === columnId);
    if (!column) return "";
    
    // UPDATED LOGIC: Prioritize display_value (for formulas) then fallback to text
    return column.display_value !== undefined ? column.display_value : column.text; 
  };

  const downloadPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin:       0.5,
      filename:     `Business_Trip_Form_${parentItem?.name || 'Form'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={downloadPDF}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0073ea",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Download as PDF
        </button>
      </div>

      <div ref={contentRef} style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <h1>Business Trip Approval Form (Form#1)</h1>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <span><strong>For:</strong> {getCol(parentItem, "text_mm10wb0d")}</span>
          <span><strong>Application#:</strong> {getCol(parentItem, "pulse_id_mm0n3z6m")}</span>
        </div>

        {/* --- MEETING SCHEDULE --- */}
        <div style={{display: "flex", justifyContent: "center"}}>
          <h2>Meeting Schedule</h2>
        </div>
        <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Meeting Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Meeting With</th>
              <th>City</th>
              <th>Country</th>
            </tr>
          </thead>
          <tbody>
            {subitems
              .filter(item => getCol(item, "date_mm0vn0s2") || getCol(item, "long_text_mm0xjekn"))
              .map((item, index) => (
                <tr key={index}>
                  <td>{getCol(item, "date_mm0vn0s2")}</td>
                  <td>{getCol(item, "text_mm0wkbr")}</td>
                  <td>{getCol(item, "text_mm10xyzs")}</td>
                  <td>{getCol(item, "long_text_mm0xjekn")}</td>
                  <td>{getCol(item, "text_mm0xfhpd")}</td>
                  <td>{getCol(item, "text_mm10j6py")}</td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* --- FLIGHT INFORMATION --- */}
        <div style={{display: "flex", justifyContent: "center"}}>
          <h2>Flight Information</h2>
        </div>
        <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Flight Date</th>
              <th>From</th>
              <th>Dep. Time</th>
              <th>To</th>
              <th>Arr. Time</th>
              <th>Info</th>
              <th>Class</th>
              <th>Fare</th>
            </tr>
          </thead>
          <tbody>
            {subitems
              .filter(item => getCol(item, "date_mm0vhs23") || getCol(item, "text_mm105tk1"))
              .map((item, index) => (
                <tr key={index}>
                  <td>{getCol(item, "date_mm0vhs23")}</td>
                  <td>{getCol(item, "text_mm105tk1")}</td>
                  <td>{getCol(item, "text_mm0w2te7")}</td>
                  <td>{getCol(item, "text_mm106k30")}</td>
                  <td>{getCol(item, "text_mm0w2db4")}</td>
                  <td>{getCol(item, "text_mm0v92fc")}</td>
                  <td>{getCol(item, "dropdown_mm0v6tr4")}</td>
                  <td>{getCol(item, "numeric_mm0vhjbs")}</td>
                </tr>
            ))}
            <tr><td colSpan="8"><span>Total Flight Fare : {getCol(parentItem, "numeric_mm0vcya6")} </span></td></tr>
          </tbody>
        </table>

        {/* --- HOTEL --- */}
        <div style={{display: "flex", justifyContent: "center"}}>
          <h2>Hotel</h2>
        </div>
        <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Hotel Name & Address</th>
              <th>Phone</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {subitems
              .filter(item => getCol(item, "date_mm0vyad1") || getCol(item, "text_mm0vry6"))
              .map((item, index) => (
                <tr key={index}>
                  <td>{getCol(item, "date_mm0vyad1")}</td>
                  <td>{getCol(item, "date_mm0v9k89")}</td>
                  <td>{getCol(item, "text_mm0vry6")}</td>
                  <td>{getCol(item, "phone_mm0vwfgz")}</td>
                  <td>{getCol(item, "numeric_mm0vqr22")}</td>
                </tr>
            ))}
            <tr><td colSpan="5"><span>Total Hotel Fare : {getCol(parentItem, "numeric_mm0vb72b")} </span></td></tr>
          </tbody>
        </table>

        {/* --- ADDITIONAL EXPENSE --- */}
        <div style={{display: "flex", justifyContent: "center"}}>
          <h2>Additional Expense</h2>
        </div>
        <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Expense Item</th>
              <th>Details</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {subitems
              .filter(item => getCol(item, "text_mm0vpk2q") || getCol(item, "numeric_mm0vty46"))
              .map((item, index) => (
                <tr key={index}>
                  <td>{getCol(item, "text_mm0vpk2q")}</td>
                  <td>{getCol(item, "long_text_mm0vft61")}</td>
                  <td>{getCol(item, "numeric_mm0vty46")}</td>
                </tr>
            ))}
            <tr><td colSpan="3"><span>Total Expense Rate: {getCol(parentItem, "numeric_mm0w80k3")} </span></td></tr>
          </tbody>
        </table>


        {/* --- TOTAL ALLOWANCE --- */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <h2>Total Allowance</h2>
        </div>
        <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ padding: "10px" }}>Number of Days</th>
              <th style={{ padding: "10px" }}>Travel Allowance/day</th>
              <th style={{ padding: "10px" }}>Total Travel Allowance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "10px", textAlign: "center" }}>{getCol(parentItem, "formula_mm101kxf")}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{getCol(parentItem, "formula_mm107zzm")}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{getCol(parentItem, "formula_mm109yq9")}</td>
            </tr>
          </tbody>
        </table>

        <div style={{display: "flex", justifyContent: "center"}}>
          <h2>Memo(Accompany and etc)</h2>
        </div>
        <div>
          Estimated Total Cost - {getCol(parentItem, "formula_mm0wnbaq")}
        </div>
        <hr/>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            margin: "40px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* LEFT 2x2 TABLE */}
          <table
            style={{
              borderCollapse: "collapse",
              width: "450px",
              tableLayout: "fixed",
              border: "2px solid black",
            }}
          >
            <tbody>
              <tr>
                <td style={{ border: "1px solid black", textAlign: "center", padding: "8px" }}>
                  <strong>Manager</strong>
                </td>
                <td style={{ border: "1px solid black", textAlign: "center", padding: "8px" }}>
                  <strong>Administration</strong>
                </td>
              </tr>

              <tr>
                <td style={{ border: "1px solid black", height: "100px", verticalAlign: "top", textAlign: "center", padding: "8px" }}>
                  {getCol(parentItem, "multiple_person_mm0nc8ye")}
                  <div style={{ marginTop: "30px", borderTop: "1px solid black", width: "70%", marginLeft: "15%" }} />
                  <div style={{ marginTop: "15px" }}>{getCol(parentItem, "date_mm0w2v3q")}</div>
                </td>

                <td style={{ border: "1px solid black", height: "100px", verticalAlign: "top", textAlign: "center", padding: "8px" }}>
                  {getCol(parentItem, "multiple_person_mm0n3n7m")}
                  <div style={{ marginTop: "30px", borderTop: "1px solid black", width: "70%", marginLeft: "15%" }} />
                  <div style={{ marginTop: "15px" }}>{getCol(parentItem, "date_mm0ww9mm")}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ width: "80px", borderTop: "2px solid black" }} />

          {/* RIGHT BOX */}
          <table
            style={{
              borderCollapse: "collapse",
              width: "200px",
              tableLayout: "fixed",
              border: "2px solid black",
            }}
          >
            <tbody>
              <tr>
                <td style={{ border: "1px solid black", textAlign: "center", padding: "8px" }}>
                  <strong>Managing Director</strong>
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid black", height: "120px", verticalAlign: "top", textAlign: "center", padding: "8px" }}>
                  {getCol(parentItem, "multiple_person_mm0pgsjy")}
                  <div style={{ marginTop: "40px", borderTop: "1px solid black", width: "70%", marginLeft: "15%" }} />
                  <div style={{ marginTop: "20px" }} />
                  {getCol(parentItem, "date_mm0w73yx")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;