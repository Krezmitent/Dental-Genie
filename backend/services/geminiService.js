const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

const CONTEXT = 'services/gemini';
let genAI = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

async function chatWithReport(report, message, history = []) {
  if (!genAI) {
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
      throw new Error('Gemini API is not configured on the backend.');
    }
  }

  const systemInstruction = `You are a helpful, empathetic, and professional dental AI assistant. 
You are speaking directly with a patient about their recent dental X-ray diagnosis report.
Here is the patient's report context:
- Overall Severity: ${report.overallSeverity || 'Unknown'}
- AI Findings: ${JSON.stringify(report.predictions || [])}
- Dentist Notes: ${report.dentistNotes || 'None yet'}
    
Guidelines:
- Explain medical terms in simple, easy-to-understand language.
- Reassure the patient but do not give definitive medical advice (always recommend seeing their dentist).
- If they ask about something not in the report, politely say you can only discuss their current diagnosis.
- Keep responses concise (under 150 words).`;

  try {
    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: systemInstruction 
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    logger.error(CONTEXT, 'Gemini API Error', { message: error.message });
    throw error;
  }
}

async function generatePDFSummary(report) {
  if (!genAI) {
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
      throw new Error('Gemini API is not configured on the backend.');
    }
  }

  const systemInstruction = `You are an expert dental AI. Your job is to summarize an AI object-detection report for a patient's PDF record.
You must return valid JSON matching this schema:
{
  "patientSummary": "A 2-3 sentence overview of their oral health based on the findings.",
  "detailedFindings": [
    {
      "label": "finding_label",
      "explanation": "A customized 1-2 sentence explanation of this specific finding, tailored to the fact that it was detected for this patient."
    }
  ]
}
Ensure the detailedFindings array contains exactly one object for EVERY prediction in the input.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `Generate a PDF summary for this report.
Overall Severity: ${report.overallSeverity || 'Unknown'}
Predictions (each represents one detected instance on the x-ray):
${JSON.stringify(report.predictions || [])}
Dentist Notes: ${report.dentistNotes || 'None'}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return JSON.parse(response.text());
  } catch (error) {
    logger.error(CONTEXT, 'Gemini API PDF Summary Error', { message: error.message });
    throw error;
  }
}

module.exports = { chatWithReport, generatePDFSummary };
