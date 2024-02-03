import React, { useState } from 'react';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import api from "../../services/api";
import moment from 'moment'; // Importe a biblioteca moment

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
  },
  paper: {
    padding: theme.spacing(3),
    maxWidth: 600,
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  emailSection: {
    marginTop: theme.spacing(2),
  },
}));

const EmailScheduler = () => {
  const classes = useStyles();
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emails, setEmails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(""); // Altere para uma string para a entrada de texto

  const handleSendEmail = async () => {
    if (subject && message && selectedDate) {
      const senderEmails = sender.split(',').map(email => email.trim());

      try {
        for (const email of senderEmails) {
          const formattedDate = moment(selectedDate).format('YYYY-MM-DDTHH:mm'); // Formata a data e hora
          
          console.log("Valor de selectedDate:", selectedDate);

          const response = await api.post(
            `${process.env.REACT_APP_BACKEND_URL}/agendar-envio-email`,
            {
              email,
              tokenSenha: "",
              assunto: subject,
              mensagem: message,
              sendAt: formattedDate,
            }
          );

          console.log("Resposta da API para", email, ":", response.data);

          setEmails([...emails, { sender: email, subject, message }]);
        }

        setSender("");
        setSubject("");
        setMessage("");
        setSelectedDate("");
      } catch (error) {
        console.error("Erro na API:", error);
      }
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <CssBaseline />
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <Typography variant="h5" gutterBottom>
            Agendamento de Emails
          </Typography>
          <form className={classes.form}>
            <TextField
              label="Destinatario (separe por vírgula)"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <TextField
              label="Assunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <TextField
              label="Mensagem"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <TextField
              label="" // Instruções para o formato
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              type="datetime-local"
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendEmail}
              fullWidth
            >
              Agendar Envio
            </Button>
          </form>
        </Paper>
      </div>
    </Container>
  );
};

export default EmailScheduler;
