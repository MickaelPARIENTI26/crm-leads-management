import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeleproDashboard from './components/TeleproDashboard';
import ImportLeads from './components/ImportLeads';
import LeadsList from './components/LeadsList';
import LeadEditModal from './components/LeadEditModal';
import './App.css';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Login} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/telepro" component={TeleproDashboard} />
        <Route path="/import-leads" component={ImportLeads} />
        <Route path="/leads" component={LeadsList} />
        <Route path="/lead/edit/:id" component={LeadEditModal} />
      </Switch>
    </Router>
  );
};

export default App;