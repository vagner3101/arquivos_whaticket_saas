import React, { useState, useEffect, useRef, useContext } from 'react';
import './Chat.css'; // Importe o arquivo de estilo do chat
import axios from 'axios'; // Importe o Axios
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";

function ChatApp() {
  const { handleLogout, loading } = useContext(AuthContext);
  const { user } = useContext(AuthContext);

  const welcomeMessage = user && user.name 
    ? `Olá ${user.name}, Bem Vindo,\n\nComo posso ajudar você hoje?`
    : "Olá, Bem Vindo,\n\nComo posso ajudar você hoje?";

  const [messages, setMessages] = useState([{ text: welcomeMessage, type: 'ai' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageContainerRef = useRef(null);

  const handleAskQuestion = async () => {
    if (!input) return;

    setIsLoading(true);
    const newMessages = [...messages, { text: input, type: 'user' }];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await api.post('/openai', { // Use o Axios para fazer a solicitação GET
        prompt: input, // Adicione a pergunta como parâmetro da consulta
      });

      if (response.status === 200) { // Verifique o status da resposta
        const data = response.data;
        const answerMessage = { text: data.answer, type: 'ai' };
        setMessages([...newMessages, answerMessage]);
      } else {
        console.error('Erro ao consultar a API da OpenAI');
      }
    } catch (error) {
      console.error('Erro ao consultar a API da OpenAI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use useEffect para rolar automaticamente para baixo quando uma nova mensagem for adicionada
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="ChatApp">
      <div className="Chat">
        <h1 className="ChatTitle">Geração de Textos com IA</h1>
        <div className="MessageContainer" ref={messageContainerRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`Message ${message.type === 'user' ? 'UserMessage' : 'AIMessage'}`}
            >
              {message.text}
            </div>
          ))}
          {isLoading && <div className="TypingIndicator">Digitando...</div>}
        </div>
        <div className="QuestionInput">
          <input
            type="text"
            placeholder="Digite sua pergunta aqui"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={handleAskQuestion}>Enviar</button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;