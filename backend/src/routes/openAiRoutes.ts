import express from 'express';
import fetch from 'node-fetch';
import dotenv from "dotenv";

dotenv.config();

const openAiRoutes = express.Router();

openAiRoutes.post('/openai', async (req, res) => {
  const { prompt } = req.body; // Assumindo que o prompt está sendo enviado no corpo da requisição

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', { // Atualize para o endpoint correto
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,// Garanta que esta é a chave correta
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Substitua pelo modelo desejado
        messages: [
          { 
            "role": "user", 
            "content": prompt 
          }
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const answerText = data.choices[0].message.content;
      res.json({ answer: answerText }); 
    } else {
      console.error('Erro ao consultar a API da OpenAI');
      res.status(response.status).json({ error: 'Erro ao consultar a API da OpenAI' });
    }
  } catch (error) {
    console.error('Erro ao consultar a API da OpenAI:', error);
    res.status(500).json({ error: 'Erro ao consultar a API da OpenAI' });
  }
});

export default openAiRoutes;