import React, { useState, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { Visibility, VisibilityOff } from '@material-ui/icons';
import WhatsAppIcon from '@material-ui/icons/WhatsApp';
import {
	InputAdornment,
	IconButton
} from '@material-ui/core';
import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";
import logo from "../../assets/logo.png";
import fundofoto from "../../assets/background.jpg";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		height: '100vh',
		backgroundImage: `url(${fundofoto})`, // Adicione o plano de fundo aqui
		backgroundSize: 'cover',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center center',
	},
	paper: {
		backgroundColor: 'rgba(15, 27, 32, 0.7)',
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "55px 30px",
		borderRadius: "12px 12px 12px 12px",
	},
	avatar: {
		margin: theme.spacing(1),
		backgroundColor: theme.palette.secondary.main,
	},
	form: {
		width: "100%",
		marginTop: theme.spacing(1),
	},
	submit: {
		margin: theme.spacing(3, 0, 2),
	},
}));

const Login = () => {
	const classes = useStyles();

	const [user, setUser] = useState({ email: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);

	const { handleLogin } = useContext(AuthContext);

	const handleChangeInput = e => {
		setUser({ ...user, [e.target.name]: e.target.value });
	};

	const handlSubmit = e => {
		e.preventDefault();
		handleLogin(user);
	};
	const openInNewTab = url => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<div className={classes.root}>
			<Container component="main" maxWidth="xs">
				<CssBaseline />
				<div className={classes.paper}>
					<div>
						<img style={{ margin: "0 auto", width: "100%" }} src={logo} alt="Whats" />
					</div>
					{/*<Typography component="h1" variant="h5">
					{i18n.t("login.title")}
				</Typography>*/}
					<form className={classes.form} noValidate onSubmit={handlSubmit}>
						<TextField
							variant="outlined"
							margin="normal"
							required
							fullWidth
							id="email"
							label={i18n.t("login.form.email")}
							name="email"
							value={user.email}
							onChange={handleChangeInput}
							autoComplete="email"
							autoFocus
						/>
						<TextField
							variant="outlined"
							margin="normal"
							required
							fullWidth
							name="password"
							label={i18n.t("login.form.password")}
							type={showPassword ? 'text' : 'password'}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											aria-label="toggle password visibility"
											onClick={() => setShowPassword((e) => !e)}
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								)
							}}
							id="password"
							value={user.password}
							onChange={handleChangeInput}
							autoComplete="current-password"
						/>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							color="primary"
							className={classes.submit}
						>
							{i18n.t("login.buttons.submit")}
						</Button>
						<Grid container>
							<Grid item>
								<Link
									href="#"
									variant="body2"
									component={RouterLink}
									to="/forgetpsw"
								>
									{i18n.t("Esqueci minha senha")}
								</Link>
							</Grid>
							<Grid item>
								<Link
									href="#"
									variant="body2"
									component={RouterLink}
									to="/signup"
								>
									{i18n.t("login.buttons.register")}
								</Link>
							</Grid>
						</Grid>
					</form>
					<IconButton color="primary"
						onClick={() => openInNewTab(`https://wa.me/554920208687?text=Ol%C3%A1`)}>
						<WhatsAppIcon />
					</IconButton>
					<Typography variant="caption">Chamar suporte no WhatsApp</Typography>

				</div>
			</Container>
		</div>
	);
};

export default Login;
