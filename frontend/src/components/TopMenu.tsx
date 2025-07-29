import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";

function TopMenu() {
	return (
		<Navbar expand="lg" className="navbar navbar-dark bg-dark">
			<Container>
				<Navbar.Brand href="/">UBC Campus Explore</Navbar.Brand>
				<Navbar.Toggle aria-controls="basic-navbar-nav" />
				<Navbar.Collapse id="basic-navbar-nav">
					<Nav className="me-auto">
						<Nav.Link as={Link} to="/">
							Home
						</Nav.Link>
						<Nav.Link as={Link} to="/route">
							Route
						</Nav.Link>
						<Nav.Link as={Link} to="/about">
							About
						</Nav.Link>
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
}

export default TopMenu;
