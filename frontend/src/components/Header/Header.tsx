import logo from '../../assets/VolunteerHub.png'
import "./Header.css"
// currently unused. might refactor later.
export default function Header() {
    return (
        <header>
            <img className="logo" src={logo}></img>
        </header>
    )
}
