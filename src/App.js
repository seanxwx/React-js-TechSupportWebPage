import React, { Component } from 'react';
import './App.css';
import { Navbar, Button, Nav, NavItem, Jumbotron } from 'react-bootstrap';
import firebase from 'firebase';
import { Route, Redirect } from 'react-router';
import Dashboard from './components/Dashboard';
import logo from './logo.svg';
import rmithome from './rmit2.png';
import rmitbackground1 from './homebackground1.jpg';
import rmitbackground2 from './homebackground2.jpg';
import rmitbackground3 from './homebackground3.jpg';
import rmitblack from './rmitBlackboard.png';
import rmitlogo from './rmitLogo.png';
import rmitanimate from './rmit-logo-animate.png';


class App extends Component {
    state = {
        type: null,
        user: null
    }

    componentWillMount () {
        firebase.auth().onAuthStateChanged(this.handleCredentials);
    }

    componentWillUnmount() {
        if(this.state.user !== null) {
            localStorage.setItem('type', this.state.type);
        }
    }

    handleClick = (type) => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then((success) => { this.handleCredentials(success.user) })
            .then(() => { this.handleLogin(type) });
    }

    handleCredentials = (params) => {
        console.log(params);
        this.setState({
            user: params,
            type: localStorage.getItem('type')
        });
    }

    handleLogin = (type) => {
        localStorage.setItem('type', type);
        this.setState({
            type: type
        });

        /* Add user to our mongodb database */
        /* MongoDB schema - will insert the user's details into the database */
        const user = {};
        user['user/' + this.state.user.uid] = {
            type: type,
            name: this.state.user.displayName,
            id: this.state.user.uid
        };
        firebase.database().ref().update(user)
    }

    handleSignout = () => {
        const vm = this;
        vm.setState({
            user: null,
            type: null
        });
        localStorage.setItem('type', null);
        firebase.auth().signOut().then(function () {
            alert('You have been signed out');
        });
    }

    render() {
        return (
            <div className="App_background">
                <div className="App_darken" />
                <div className="App">
                    <Navbar inverse>
                        <Navbar.Header>
                            <Navbar.Brand>
                                <a href="#">RMIT Ticket System</a>
                            </Navbar.Brand>
                        </Navbar.Header>
                        <Nav pullRight>
                            {this.state.user !== null &&
                            <NavItem onClick={this.handleSignout}>Sign out</NavItem>
                            }
                        </Nav>
                    </Navbar>

                    <div className="container">
                        <Route exact path="/" render={() => (
                            this.state.user === null ? (

                                    <Jumbotron className="text-center">
                                        <div className="Jumbo">
                                            <img src={rmitanimate} className="App-rmit-logo" alt="rmit"/>
                                            <h1>Welcome to RMIT University helpdesk</h1>
                                            <p>
                                                Please select your account type:
                                            </p>

                                            <div className="text-center">
                                                <Button bsSize="large" bsStyle="primary" style={{marginRight:10}} onClick={() => this.handleClick('helpdesk')}>Helpdesk User</Button>
                                                <Button bsSize="large" bsStyle="success" onClick={() => this.handleClick('tech')}>Tech User</Button>
                                            </div>
                                        </div>
                                    </Jumbotron>

                                )
                                : (
                                    <Redirect to="/dashboard" />
                                )
                        )} />
                        <Route exact path="/dashboard" render={() => (
                            this.state.user !== null ? (
                                    <Dashboard user={this.state.user} type={this.state.type} />
                                )
                                : (
                                    <Redirect to="/" />
                                )
                        )} />
                        <footer className="footer">
                            <div>
                                <img src={rmitblack}/>
                            </div>
                            <p>
                                <img src={rmitlogo}/>
                                © Copyright 2017 RMIT UNIVERSITY| ABN 49 781 030 034 | CRICOS PROVIDER NUMBER: 00122A
                            </p>
                        </footer>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
