import React, { useState, useEffect } from "react";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";

import { Box, Chip } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { CSVLink } from "react-csv";
import { isArray, isString } from "lodash";

const useStyles = makeStyles((theme) => ({
  screen: {
    // backgroundColor: "red",
  },
  container: {
    backgroundColor: "#FAFAFA",
    padding: "20px",
    borderRadius: "6px",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  btnWrapper: {
    position: "relative",
    backgroundColor: "#1E90FF",
    color: "white",
    border: "none",
    textDecorationLine: "none",
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
}));

const ContactsExport = (props) => {
  const classes = useStyles();

  const [queues, setQueues] = useState([]);
  const [queueSelected, setQueueSelected] = useState([]);

  const [tags, setTags] = useState([]);
  const [selecteds, setSelecteds] = useState([]);

  const [planilha, setPlanilha] = useState([]);

  /* select tag */
  useEffect(() => {
    async function fetchData() {
      await loadTags();
      await loadQueues();
    }
    fetchData();
  }, []);

  // Pega Tags
  const loadTags = async () => {
    try {
      const { data } = await api.get(`/tags/list`);
      setTags(data);
    } catch (err) {
      toastError(err);
    }
  };

  // Pega filas
  const loadQueues = async () => {
    try {
      const { data } = await api.get(`/queue`);
      setQueues(data);
    } catch (err) {
      toastError(err);
    }
  };

  const onChangeTags = (value, reason) => {
    let optionsChanged = [];
    if (reason === "create-option") {
      if (isArray(value)) {
        for (let item of value) {
          optionsChanged.push(item);
        }
      }
    } else {
      optionsChanged = value;
    }
    setSelecteds(optionsChanged);
  };

  const onChangeQueues = (value, reason) => {
    let optionsChanged = [];
    if (reason === "create-option") {
      if (isArray(value)) {
        for (let item of value) {
          optionsChanged.push(item);
        }
      }
    } else {
      optionsChanged = value;
    }
    setQueueSelected(optionsChanged);
  };

const handleExport = async () => {
  try {
    const tags = selecteds.map((tag) => tag.id);
    const queueIds = queueSelected.map((queue) => queue.id);

    const params = {
      tags: JSON.stringify(tags),
      queueIds: JSON.stringify(queueIds),
    };

    const { data } = await api.get("/exportar/baixar", { params });
    const filePath = data.filePath;

    // Perform the download
    const downloadUrl = `${process.env.REACT_APP_BACKEND_URL}/${filePath}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Alternatively, you can use the following code to open the download in a new tab
    // window.open(downloadUrl, "_blank");

  } catch (err) {
    toastError(err);
  }
};

  return (
    <div className={classes.screen}>
      <div className={classes.container}>
        <div>
          <p>Deseja selecionar algum filtro?</p>

          <Box style={{ padding: 10 }}>
            <Autocomplete
              multiple
              size="small"
              options={tags}
              value={selecteds}
              getOptionLabel={(option) => option.name}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    style={{
                      backgroundColor: option.color || "#eee",
                      textShadow: "1px 1px 1px #000",
                      color: "white",
                    }}
                    label={option.name}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Filtro por Tags"
                />
              )}
              onChange={(e, value, acao) => onChangeTags(value, acao)}
            />
          </Box>

          <Box style={{ padding: 10 }}>
            <Autocomplete
              multiple
              size="small"
              options={queues}
              value={queueSelected}
              getOptionLabel={(option) => option.name}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    style={{
                      backgroundColor: option.color || "#eee",
                      textShadow: "1px 1px 1px #000",
                      color: "white",
                    }}
                    label={option.name}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Filtro por Setores"
                />
              )}
              onChange={(e, value, acao) => onChangeQueues(value, acao)}
            />
          </Box>

          <hr style={{ color: "rgb(230, 230, 230)" }} />
        </div>

        <div>
          <DialogActions>
            <Button
              onClick={props.handleClose}
              color="primary"
              variant="outlined"
            >
              {i18n.t("contactModal.buttons.cancel")}
            </Button>

            <Button
              variant="contained"
              color="primary"
              className={classes.buttonEnvi}
              onClick={handleExport}
            >
              EXPORTAR
            </Button>
          </DialogActions>
        </div>
      </div>
      {planilha.length > 0 && (
        <CSVLink
          separator=";"
          filename={"wpwchat-contatos.csv"}
          data={planilha}
          className={classes.btnWrapper}
          target="_blank"
        >
          <span style={{ display: "none" }}>Download CSV</span>
        </CSVLink>
      )}
    </div>
  );
};

export default ContactsExport;