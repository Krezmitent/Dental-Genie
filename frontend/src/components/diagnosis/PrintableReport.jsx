import React from 'react';

const PrintableReport = ({ report }) => {
  if (!report) return null;

  // Patient-friendly explanations for common AI findings
  const explanationMap = {
    caries: "Cavity or Decay: A decayed area of your tooth that typically requires a filling to prevent further damage.",
    calculus: "Tartar Buildup: Hardened dental plaque that must be removed professionally to prevent gum disease.",
    gingivitis: "Gum Inflammation: Early stage of gum disease. Can often be reversed with good oral hygiene and professional cleaning.",
    hypodontia: "Missing Teeth: One or more teeth failed to develop. Your dentist can discuss replacement options.",
    impacted_tooth: "Impacted Tooth: A tooth that is blocked from breaking through the gum. Often happens with wisdom teeth and may require extraction.",
    tooth_discoloration: "Discoloration: Staining or changes in tooth color. Can be cosmetic or indicate underlying issues.",
    periodontal_disease: "Gum Disease: Advanced infection of the tissues that hold your teeth in place.",
    periapical_lesion: "Root Infection: An infection at the tip of the tooth root, often requiring a root canal.",
    bone_loss: "Bone Loss: Reduction in the bone supporting the teeth, usually caused by advanced gum disease.",
    root_remnants: "Root Fragment: A piece of a tooth root remaining in the jaw, usually after an incomplete extraction.",
    ulcer: "Mouth Ulcer: A sore on the lining of the mouth. Usually heals on its own but should be checked if persistent."
  };

  const getExplanation = (label) => {
    const key = label.toLowerCase().replace(/\s+/g, '_');
    return explanationMap[key] || "Anomaly detected. Please consult your dentist for a detailed explanation.";
  };

  const summaryData = report.pdfSummary || null;

  return (
    <div 
      id="printable-report" 
      className="bg-white text-black font-sans p-10" 
      style={{ width: '794px', minHeight: '1123px', boxSizing: 'border-box' }}
    >
      {/* Letterhead */}
      <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dental Genie Clinic</h1>
          <p className="text-sm text-gray-600">AI-Assisted Radiographic Analysis</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Report ID: <span className="font-mono text-gray-600">{report._id.slice(-8).toUpperCase()}</span></p>
          <p className="text-sm text-gray-600">Date: {new Date(report.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">Patient Summary</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-800 mb-2">
            <strong>Overall Assessment Severity: </strong> 
            <span className="uppercase font-bold ml-1">{report.overallSeverity}</span>
          </p>
          {summaryData?.patientSummary && (
            <p className="text-sm text-gray-800 mt-2 border-t border-gray-300 pt-2">
              <strong>AI Analysis:</strong> {summaryData.patientSummary}
            </p>
          )}
          <p className="text-xs text-gray-600 mt-2 italic">
            This is an AI-generated preliminary report and does not substitute a professional clinical diagnosis.
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="mb-8 html2pdf__page-break">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">Radiograph</h2>
        <div className="border border-gray-300 p-2 rounded bg-gray-50 flex justify-center">
          <img 
            src={report.imageUrl} 
            alt="Dental X-Ray" 
            className="max-h-[350px] object-contain"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* AI Findings */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">Detailed Findings</h2>
        
        {report.predictions && report.predictions.length > 0 ? (
          <div className="space-y-4">
            {report.predictions.map((pred, idx) => {
              // Try to find dynamic explanation if available
              let dynamicExplanation = null;
              if (summaryData?.detailedFindings) {
                const match = summaryData.detailedFindings[idx]; // assuming ordered mapping
                if (match && match.explanation) {
                  dynamicExplanation = match.explanation;
                }
              }

              return (
                <div key={idx} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center w-full mb-2">
                    <h3 className="font-bold text-gray-900 capitalize text-lg pr-4">{pred.label.replace('_', ' ')}</h3>
                    <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                      AI Confidence: {(pred.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{dynamicExplanation || getExplanation(pred.label)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
            <p className="text-gray-700">No significant anomalies detected by the AI model.</p>
          </div>
        )}
      </div>

      {/* Dentist Notes */}
      {report.dentistNotes && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4">Clinical Notes</h2>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-gray-800 text-sm whitespace-pre-wrap">{report.dentistNotes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-300 text-center">
        <p className="text-xs text-gray-500">
          Report generated by Dental Genie AI (Model: {report.aiModelVersion || 'YOLO-V1'})
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Please bring this document to your next dental appointment.
        </p>
      </div>
    </div>
  );
};

export default PrintableReport;
