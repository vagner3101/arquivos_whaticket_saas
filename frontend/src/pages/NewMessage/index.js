import React, { useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";

const NewMessage = () => {
    const history = useHistory();
    const { telefone } = useParams();
    const { user } = useContext(AuthContext);

    const fetchContacts = async (searchParam, pageNumber) => {
        try {
            const { data } = await api.get("/contacts/", {
                params: { searchParam, pageNumber },
            });
            return data;
        } catch (err) {
            return [];
        }
    };

    const handleInitTicket = async values => {
        const { contacts } = await fetchContacts(values.number, 1);
        if (contacts.length === 0){
            try {
                const { data: contacts } = await api.post("/contacts", values);
                const { data: ticket } = await api.post("/tickets", {
                    contactId: contacts.id,
                    userId: user?.id,
                    status: "open",
                });
                history.push(`/tickets/${ticket.uuid}`);
            } catch (err) {
                history.push(`/tickets/`);
                toastError(err);
            }
        } else {
            try {
                const { data: ticket } = await api.post("/tickets", {
                    contactId: contacts[0].id,
                    userId: user?.id,
                    status: "open",
                });
                history.push(`/tickets/${ticket.uuid}`);
            } catch (err) {
                history.push(`/tickets/`);
                toastError(err);
            }
        }
    };

    handleInitTicket({
        name: telefone,
        number: telefone,
        email: "",
        companyId: user.companyId
    });

    return(
        <MainContainer></MainContainer>
    );
}

export default NewMessage;