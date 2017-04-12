/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var doStuff = require('./utils/do-stuff');
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  Image,
  KeyboardAvoidingView,
  View,
  ListView,
  TextInput,
} from 'react-native';

// - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TODO: figure out whether this would expose a global
// or if es6 modules prevent that from being a thing.
//
// ```
// var foo = 3;
// ```
// - - - - - - - - - - - - - - - - - - - - - - - - - - - -



/**
 * <Topbar>
 *
 * Helper component
 *
 */
class Topbar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      // TODO
    };
  }

  render() {
    return (
      <View style={STYLES.topbar}>
        <Image style={STYLES.topbarBrand} source={require('./images/chatkin-logo.png')}/>
        <View style={STYLES.topbarIcons}>
          <Text>(W)</Text>
          <Text>(L)</Text>
        </View>
      </View>
    );
  }

}


/**
 * <mobileapp>
 *
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

export default class mobileapp extends Component {
  constructor(props) {
    super(props);
    var self = this;

    // Set up a generic datasource instance.
    const ds = new ListView.DataSource({
      rowHasChanged: function (r1, r2) {
        return r1 !== r2;
      }
    });

    // Set initial state
    this.state = {
      dsOtherUsersHere: ds.cloneWithRows([])
    };

    // TODO: loading state


    // Talk to the server.
    // fetch('http://192.168.1.19:1337/test', {
    fetch('http://localhost:1337/test', {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(function (res) {
      res.json().then(function(data){
        // alert(JSON.stringify(data.otherUsersHere));
        self.setState({
          dsOtherUsersHere: ds.cloneWithRows(data.otherUsersHere)
        });
      })
      .catch(function(err) {
        console.error(err);
        alert(err);
      });

    })//</then>
    .catch(function(err){
      console.error(err);
      alert(err);
    });

  }


  render() {

    return (
      <KeyboardAvoidingView
        behavior='padding'
        style={STYLES.container}
        noScroll={true}>
        <Topbar></Topbar>
        <View style={STYLES.listViewWrapper}>
          <ListView
            dataSource={this.state.dsOtherUsersHere}
            enableEmptySections={true}
            renderHeader={this.renderListViewHeader}
            renderRow={this.renderListViewRow}
            renderFooter={this.renderListViewFooter}
          />
        </View>
        <View style={STYLES.formWrapper}>
          <TextInput
            style={STYLES.textInput}
            placeholder="Update your message!"
            onSubmitEditing={this.updateRemark}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  updateRemark = function() {
    // TODO
  };

  renderListViewHeader = function(rowData) {
    return(<View style={{height: 10}}/>);
  };

  renderListViewRow = function(rowData) {
    return(<View>
      <Text
        style={[ STYLES.chatHeader, {color: rowData.avatarColor} ]}>
        { rowData.twitterUsername ? '@'+rowData.twitterUsername : rowData.username }
      </Text>
      <Text
        style={STYLES.chatBody}>
        { rowData.remark }
      </Text>
    </View>
    );
  };

  renderListViewFooter = function(rowData) {
    return(<View style={{height: 25}}/>);
  };


}

const STYLES = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  topbar: {
    paddingTop: 30,
    paddingLeft: 15,
    paddingRight: 15,
    height: 64,
    backgroundColor: '#fff',
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomColor: '#dae5eb',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },

  topbarBrand: {
    width: 135,
    height: 28
    // flex: 1,
    // height: 10
  },

  topbarIcons: {
    flex: 1,
    flexDirection: 'row-reverse',
  },

  listViewWrapper: {
    flex: 1,
    flexGrow: 1,
    paddingLeft: 15,
    paddingRight: 15,
  },

  chatHeader: {
    fontWeight: '700',
    fontSize: 15,
    marginTop: 10
  },

  chatBody: {
    color: 'rgba(0,0,0,0.7)',
    marginBottom: 10,
    textAlign: 'justify'
  },

  formWrapper: {
    padding: 15,
    borderTopColor: '#dae5eb',
    borderStyle: 'solid',
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },

  textInput: {
    fontSize: 16,
    height: 60,
  },

});

AppRegistry.registerComponent('mobileapp', () => mobileapp);


// alert(doStuff());
