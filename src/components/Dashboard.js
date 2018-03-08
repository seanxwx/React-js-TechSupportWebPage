import React, { Component } from 'react';
import Helpdesk from './dashboard/Helpdesk';
import Tech from './dashboard/Tech';
import { Row, Grid, Col, Jumbotron } from 'react-bootstrap';

class Dashboard extends Component {
    render () {
        return (
            <div>
                <Grid>
                    <Row className="show-grid">
                        <Col md={3}>
                            <Jumbotron style={{padding: 10}} className="text-center">
                                <img src={this.props.user.photoURL} className="img-responsive img-circle" style={{padding:20, height: 200}} />
                                <h4 className="text-uppercase">Hello</h4>
                                <h3>{this.props.user.displayName}</h3>
                            </Jumbotron>
                        </Col>
                        <Col md={9}>
                            {this.props.type === 'helpdesk' ? (
                                    <Helpdesk />
                                )
                                : this.props.type === 'tech' ? (
                                    <Tech user={this.props.user} />
                                )
                                :null}
                        </Col>
                    </Row>
                </Grid>
            </div>
        )
    }
}
export default Dashboard;