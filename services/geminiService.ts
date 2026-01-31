
import { GoogleGenAI } from "@google/genai";
import { ProductivityLog, Officer, LeaveRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyBriefing = async (
  officer: Officer,
  logs: ProductivityLog[],
  date: string
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Você é um oficial adjunto experiente da Polícia Militar.
    Sua tarefa é redigir a "Parte Diária" (Relatório Operacional) com base nos dados brutos fornecidos abaixo.
    
    Oficial Responsável: ${officer.graduacao} ${officer.name} (Matrícula: ${officer.matricula})
    Data: ${date}
    
    Ocorrências do dia:
    ${JSON.stringify(logs, null, 2)}
    
    Instruções:
    1. Utilize linguagem formal, militar e impessoal.
    2. Resuma as ocorrências destacando prisões em flagrante e apreensões significativas.
    3. Categorize por tipo de ocorrência.
    4. Finalize com um balanço estatístico (total de presos, total de armas/drogas).
    5. O tom deve ser informativo e preciso para o Comandante do Batalhão.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Fast response needed
      }
    });

    return response.text || "Não foi possível gerar o relatório.";
  } catch (error) {
    console.error("Erro ao gerar briefing:", error);
    return "Erro ao conectar com o serviço de Inteligência Artificial.";
  }
};

export const analyzeLeaveTrends = async (requests: LeaveRequest[]): Promise<string> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analise os seguintes pedidos de dispensa e licença de um batalhão:
    ${JSON.stringify(requests.slice(0, 20), null, 2)} 

    Forneça uma análise concisa para o setor de Recursos Humanos (P1).
    Identifique se há padrões preocupantes (ex: muitas dispensas médicas simultâneas) ou se a distribuição parece normal.
    Não mencione nomes específicos, foque nos tipos e períodos.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error(error);
    return "Erro na análise.";
  }
};
