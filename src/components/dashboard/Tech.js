import React, { Component } from 'react';
import { apiurl } from "../../helpers/constants";
import firebase from 'firebase';
import { Table, Row, Col, Jumbotron, Button } from 'react-bootstrap';
import { Panel } from 'react-bootstrap';
import ReactDOM from 'react-dom';


/*WYSIWYG editor*/
import { EditorState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import {convertFromRaw, convertToRaw} from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// Require Font Awesome.
import 'font-awesome/css/font-awesome.css';



class Tech extends Component {

    constructor(props) {
        super(props);
        this.state = {
            tickets: [],
            selectedTicket: null,

            // selectedComment:null,

            techUsers: [],
            selectedTech: null,
            ticket_priority: [],
            ticket_level: [],
            updateId: "",
            AddComment: "",
            tempStatus: "",
            selectedLevel:"",
            editorState: EditorState.createEmpty(),
        }

        this.submitChangeStatus=this.submitChangeStatus.bind(this);
        this.ChangeStatus=this.ChangeStatus.bind(this);
        this.handleTechChange=this.handleTechChange.bind(this);
        this.handleLevelChange= this.handleLevelChange.bind(this);
        this.changeAddComment=this.changeAddComment.bind(this);
        this.submitChangeLevel=this.submitChangeLevel.bind(this);
        this.closeDialogClick=this.closeDialogClick.bind(this);
        this.assignTicketToTech=this.assignTicketToTech.bind(this);
        this.submitAddComment=this.submitAddComment.bind(this);
        this.onEditorStateChange=this.onEditorStateChange.bind(this);
        this.init=this.init.bind(this);
    }


    init(){
        /* Fetch all tickets and check which tickets have
            been assigned to this tech user
        */
        fetch(apiurl + '/api/tickets')
            .then((response) => response.json())
            .then((responseJson) => {
                const myTickets = [];

                for(const ele in responseJson) {
                    firebase.database().ref('ticket/'+responseJson[ele].id).on('value', (snapshot) => {
                        if(snapshot.val() !== null && snapshot.val().user_id === this.props.user.uid) {
                            myTickets.push(responseJson[ele]);

                            /* Force the view to re-render (async problem) */
                            this.forceUpdate();
                        }
                    })
                }
                return myTickets;
            })

            .then((tickets) => {
                this.setState({
                    tickets: tickets
                });
            })
    }



    componentDidMount(){
        this.init();
        const users = firebase.database().ref('user/')
        users.on('value', (snapshot) => {
            const tempTech = [];
            for(const ele in snapshot.val()) {
                if(snapshot.val()[ele].type === 'tech') {
                    tempTech.push(snapshot.val()[ele]);
                }
            }
            this.setState({
                techUsers: tempTech
            });
        })
    }


    /* Toggle the ticket dialog */
    ticketDetailsClick = (ticket) => {
        const { selectedTicket } = this.state;
        this.setState({
            selectedTicket: (selectedTicket !== null && selectedTicket.id === ticket.id ? null : ticket),

        });

        const users = firebase.database().ref('user/')
        users.on('value', (snapshot) => {
            const tempTech = [];
            for(const ele in snapshot.val()) {
                if(snapshot.val()[ele].type === 'tech') {
                    tempTech.push(snapshot.val()[ele]);
                }
            }
            this.setState({
                techUsers: tempTech
            });
        })

        const firetickets = firebase.database().ref('ticket/'+ticket.id)
        firetickets.on('value', (snapshot) => {
            console.log(snapshot.val().ticket_level);
            var templev = snapshot.val().ticket_level
            var temppri = snapshot.val().ticket_priority;

            this.setState({
                ticket_priority : temppri,
                ticket_level:templev,

            });
        });

    }


    /* Update the selected level from dropdown box */
    handleLevelChange(event){
        this.setState({
            ticket_level: event.target.value
        });
        console.log(this.state.ticket_level);
    }


    /*submit the changed level from dropdown box
    * and store them in the firebase database*/
    submitChangeLevel= () =>{
        const firetickets = firebase.database().ref('ticket/'+this.state.selectedTicket.id)

        firetickets.update({
            "ticket_level": this.state.ticket_level,
        })
            .then(window.location.reload());
    }


    /* Close button for dialog */
    closeDialogClick = () => {
        this.setState({
            selectedTicket: null
        })
    }


    /* Update the selected tech from dropdown box */
    handleTechChange(event){
        this.setState({
            selectedTech: event.target.value
        });
    }


    /* Click assign button */
    assignTicketToTech = () => {
        if(this.state.selectedTech === null) {
            return;
        }
        /* Add assigned ticket+tech into database*/
        const data = {};
        data['ticket/' + this.state.selectedTicket.id] = {
            ticket_id: this.state.selectedTicket.id,
            user_id: this.state.selectedTech // stored Tech ID
        };
        firebase.database().ref().update(data)
        alert('Tech successfully assigned to ticket!');
        window.location.reload();
    }



    /*Update the current status of selected ticket*/
    ChangeStatus (event) {
        this.setState({
            tempStatus: event.target.value
        });
    }

    /*Store the changed status of selected ticket*/
    submitChangeStatus(){
        var id = this.state.selectedTicket.id;
        var status = this.state.tempStatus;

        fetch("http://localhost/WDA-A2/public/api/tickets"+"/"+id+"/update", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Status: status,
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.status === "SUCCESS") {
                    alert("Successfully update status");
                } else {
                    alert("Could not update status.")
                }
            })
            .then(this.init)
    }


    /*Returns the current contents of the editor*/
    onEditorStateChange =(editorState) => {
        this.setState({
            editorState,
        });
        console.log(this.state.editorState.getCurrentContent().getPlainText());
    };


    /*Add the comment of selected ticket*/
    changeAddComment (event){
        this.setState({
            AddComment: event.target.value
        });
    }


    /*    Store the added comment of selected ticket in the MySQL
        database through laravel API*/
    submitAddComment= () =>{
        var id = this.state.selectedTicket.id;
        var contentState = this.state.editorState.getCurrentContent().getPlainText();
        fetch("http://localhost/WDA-A2/public/api/Comment", {
        //     method: 'GET',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Ticket_id: id,
                Comment: contentState,
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.status === "SUCCESS") {
                    alert("Successfully add comment")
                    // this.getProducts();
                } else {
                    alert("Could not add comment.")
                }
            })
    }







    /* Render the page! */
    /* TODO : Complete in your own time:
        Do you think you could split this page into separate sub-components?
     */
    render () {
        const vm = this
        const { selectedTicket, tickets, techUsers,ticket_priority,ticket_level,editorState, selectedTech , AddComment} = this.state
        const uid = this.props.user.uid;
        return (
            <div>
                <Row>
                    <Col md={12}>
                        <h1>My Tickets</h1>
                        {tickets.length < 1 && (
                            <p className="alert alert-info">You have not been assigned any tickets</p>
                        )}

                        <Table striped hover>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Issue</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tickets.map((ticket, i) => (
                                <tr key={i}>
                                    <td>{ticket.id}</td>
                                    <td>{ticket.Software_issue}</td>
                                    <td>{ticket.Status}</td>
                                    <td>
                                        <Button bsStyle={vm.state.selectedTicket !== null && vm.state.selectedTicket.id === ticket.id ? 'success' : 'info'} onClick={() => vm.ticketDetailsClick(ticket)}>More Details</Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </Col>
                    {selectedTicket !== null && (
                        <Col md={12}>
                            <Jumbotron style={{padding: 10}}>

                                {/*tech user form table*/}
                                <Button block bsStyle="danger" onClick={this.closeDialogClick}>Close Dialog</Button>
                                <h3 className="text-uppercase">Ticket Details</h3>

                                {/*display ID*/}
                                <p><b>ID: </b>{selectedTicket.id}</p>

                                {/*display Issue*/}
                                <p><b>Issue: </b><br/>{selectedTicket.Software_issue}</p>

                                <hr/>

                                {/*display Description*/}
                                <p><b>Description: </b><br/>{selectedTicket.Description}</p>

                                {/*display Priority*/}
                                <p><b>Priority:</b><br/>{ticket_priority}</p>

                                {/*display Eecalation Level*/}
                                <p><b>Eecalation Level:</b><br/>{ticket_level}</p>

                                <hr/>

                                {/*change level option*/}
                                <p><b>Change Level:</b></p>
                                <select className="form-control" onChange={this.handleLevelChange} defaultValue="-1">
                                    <option value="-1" defaultValue disabled>Select Level</option>
                                    <option  value="one">1</option>
                                    <option  value="Two">2</option>
                                    <option  value="Three">3</option>
                                </select>
                                {/*submit the level*/}
                                <div className="clearfix"><br/>
                                    <Button className="pull-right" bsStyle="success" onClick={this.submitChangeLevel}>Change Level</Button>
                                </div>

                                {/*change level Status*/}
                                <p><b>Status: </b></p><br/>
                                <select className="form-control" onChange={this.ChangeStatus} value={this.state.tempStatus}>
                                    <option value="-1" defaultValue disabled>Please select status</option>
                                    <option value="Pending"  disabled={this.state.tempStatus=="Pending"? true: false}>Pending</option>
                                    <option value="Progress">In Progress</option>
                                    <option value="Unresolved">Unresolved</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                                {/*submit the status*/}
                                <div className="clearfix"><br/>
                                    <Button className="pull-right" bsStyle="success" onClick={this.submitChangeStatus}>Change Status</Button>
                                </div>

                                {/*edit the comment*/}
                                <p><b>Give Feedback:</b></p>
                                <Editor
                                    editorState={editorState}
                                    wrapperClassName="demo-wrapper"
                                    editorClassName="demo-editor"
                                    onEditorStateChange={this.onEditorStateChange}
                                    placeholder="Please edit your feedback..."
                                />
                                {/*submit the comment*/}
                                <div className="clearfix"><br/>
                                    <Button className="pull-right" bsStyle="success" onClick={this.submitAddComment}>Give feedback</Button>
                                </div>

                                {techUsers.length > 0 && (
                                    <div>
                                        <hr/>

                                        <h3 className="text-uppercase">Assign</h3>
                                        <select className="form-control" onChange={this.handleTechChange} defaultValue="-1">
                                            <option value="-1" defaultValue disabled>Select a tech user</option>
                                            {techUsers.map((user, i) => (
                                                <option key={i} disabled={user.id==uid? true: false} value={user.id}>{user.name} </option>
                                            ))}
                                        </select>

                                        <div className="clearfix"><br/>
                                            <Button className="pull-right" bsStyle="info" onClick={this.assignTicketToTech}>Assign</Button>
                                        </div>
                                    </div>
                                )
                                }
                            </Jumbotron>
                        </Col>
                    )}
                </Row>
            </div>
        );
    }
}

export default Tech;