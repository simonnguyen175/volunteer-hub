import { Link } from "react-router";
import "./Login.css";

interface Props {
	setLoginOpen: (isOpen: boolean) => void;
}

export default function Login({ setLoginOpen }: Props) {
	return (
		<>
			<div className="overlay" onClick={() => setLoginOpen(false)}></div>
			<div className="modal">
				<h1 className="login-title">Log in.</h1>
				<p className="login-subtitle">
					Log in and start volunteering.
				</p>

				<form className="form">
					<input type="email" placeholder="Email"/>

					<div className="password-row">
						<input type="password" placeholder="Password" />
						<Link to="/forgor" className="forgot">
							Forgot?
						</Link>
					</div>
				</form>

				<button className="login-btn">Log in</button>

				<p className="signup">
					Don't have an account?
					&nbsp;
					<Link to="/signup">Sign up</Link>
				</p>

				<button onClick={() => setLoginOpen(false)}>Close</button>
			</div>
		</>
	);
}
