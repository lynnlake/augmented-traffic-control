/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require('react');
var AtcRestClient = require('./api');
var CollapsePanel = require('./utils').CollapsePanel;
var ServerInfoPanel = require('./server');
var GroupPanel = require('./group');
var ProfilePanel = require('./profiles');
var ShapingPanel = require('./shaping');

var Atc = React.createClass({
  getInitialState: function() {
    return {
      client: new AtcRestClient(this.props.primary, this.props.secondary, this.props.endpoint),
      profiles: null,
      potential: null,
      current: null,
      changed: false,
    };
  },

  componentDidMount: function() {
    this.updateState();
    this.update_interval = setInterval(this.updateState, 3000);
  },

  componentWillUnmount: function() {
    clearInterval(this.update_interval);
  },

  updateState: function() {
    this.fetchProfiles();
    this.fetchShaping();
  },

  createNewProfile: function(name) {
    // FIXME SETTINGS
    this.state.client.createProfile(
      {name:name, shaping:this.state.potential.shaping}, function(rc) {
        if (rc.status == 200) {
          this.fetchProfiles();
        }
      }.bind(this)
    );
  },

  fetchProfiles: function() {
    this.state.client.getProfiles(function (rc) {
      if (rc.status == 200) {
        this.setState({
          profiles: rc.json.profiles,
        });
      }
    }.bind(this));
  },

  selectProfile: function(shaping) {
    this.setState({
      potential: {shaping: shaping},
      changed: true,
    });
  },

  fetchShaping: function() {
    this.state.client.getShaping(function(rc) {
      var current = null;
      if (rc.status != 200) {
        current = null;
      } else {
        current = rc.json;
      }
      this.setState({current: current});
      if (this.state.changed) {
        // Don't overwrite the user-provided info in potential
        return;
      }
      if (rc.status != 200 || rc.json.shaping == null) {
        this.setState({potential: {shaping: this.state.client.defaultShaping()}});
      } else {
        this.setState({potential: rc.json});
      }
    }.bind(this));
  },

  performShaping: function() {
    this.state.client.shape(this.state.potential, function(rc) {
      if (rc.status == 200) {
        this.setState({
          current: rc.json.shaping,
          potential: rc.json.shaping,
          changed: false,
        });
      }
    }.bind(this));
  },

  clearShaping: function() {
    this.state.client.unshape(function(rc) {
      if (rc.status == 204) {
        // Notify unshaped successfully
        this.setState({
          current: null,
        });
      }
    }.bind(this));
  },

  render: function () {
    return (
      <div>
        <CollapsePanel title="Profiles">
          <ProfilePanel profiles={this.state.profiles} onSave={this.createNewProfile} onSelect={this.selectProfile} />
        </CollapsePanel>
        <CollapsePanel title="Shaping">
          <ShapingPanel current={this.state.current} potential={this.state.potential} shapingDisabled={!this.state.changed} onPerformShaping={this.performShaping} onClearShaping={this.clearShaping} onSetPotential={this.selectProfile} />
        </CollapsePanel>
        <CollapsePanel title="Group">
          <GroupPanel client={this.state.client} />
        </CollapsePanel>
        <CollapsePanel title="Server Info">
          <ServerInfoPanel client={this.state.client} />
        </CollapsePanel>
      </div>
    );
  },
});

module.exports = Atc
