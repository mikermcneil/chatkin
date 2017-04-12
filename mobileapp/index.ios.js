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
  ScrollView,
  TextInput,
  Navigator,
  Button,
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
 * <mobileapp>
 *
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

export default class mobileapp extends Component {
  initialRoute = (function(){
    var isLoggedIn = false;

    var initialRouteId;
    if(isLoggedIn) {
      initialRouteId = 'home';
    }
    else {
      initialRouteId = 'login';
    }

    return { id: initialRouteId };
  }())

  renderNavigationScene(route, navigator) {
    switch(route.id) {
      case 'login':
        return (<LoginPage navigator={navigator}/>);
      case 'home':
        return (<HomePage navigator={navigator}/>);
    }
  }

  render() {
    return(
      <Navigator
      initialRoute={ this.initialRoute }
      renderScene={ this.renderNavigationScene }
      />
    );
  }
}

/**
 * LoginPage
 */
class LoginPage extends Component {

  navigateToHomepage(){
    this.props.navigator.replace({ id: 'home' });
  }

  render() {
    return(
      <View style={{flex: 1}}>
        <KeyboardAvoidingView
          behavior='padding'
          style={STYLES.loginWrapper}>
          <ScrollView>
            <View style={STYLES.loginContainer}>
              <View style={STYLES.loginBrandWrapper}>
                <Image style={STYLES.loginBrand}
                  source={require('./images/chatkin-logo-vertical.png')}/>
              </View>
              <View style={STYLES.loginInputWrapper}>
                <TextInput
                  style={STYLES.loginInput}
                  placeholder="Username"
                />
              </View>
              <View style={STYLES.loginInputWrapper}>
                <TextInput
                  style={STYLES.loginInput}
                  placeholder="Password"
                  secureTextEntry={true}
                />
              </View>
              <View style={STYLES.submitButtonWrapper}>
                <Button
                  color="#fff"
                  onPress={ this.navigateToHomepage.bind(this) }
                  title='Sign in'
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
}


/**
 * HomePage
 */
class HomePage extends Component {

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
        <View style={STYLES.topbar}>
          <Image style={STYLES.topbarBrand}
            source={require('./images/chatkin-logo.png')}/>
          <View style={STYLES.topbarIcons}>
            <Text>(W)</Text>
            <Text>(L)</Text>
          </View>
        </View>
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
  loginWrapper: {
    flex: 1,
    alignContent: 'center',
    backgroundColor: '#bdcdd5',
    paddingLeft: 15,
    paddingRight: 15,
  },

  loginContainer: {
    borderStyle: 'solid',
    borderColor: '#9CA4A6',
    borderWidth: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 35,
    marginTop: 50,
    marginBottom: 50,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 7,
  },

  loginBrandWrapper: {
    paddingTop: 35,
    paddingBottom: 35,
    borderBottomColor: '#ccc',
    borderStyle: 'solid',
    borderWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    marginBottom: 35,
  },

  loginBrand: {
    width: 150,
    height: 105,
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  loginInputWrapper: {
    borderRadius: 6,
    borderStyle: 'solid',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    backgroundColor: '#fff',
  },

  loginInput: {
    fontSize: 18,
    height: 46,
    paddingLeft: 16,
    paddingRight: 16,
  },

  submitButtonWrapper: {
    borderRadius: 6,
    backgroundColor: '#90b63e',
    borderColor: '#81a338',
    borderWidth: 1,
    borderStyle: 'solid',
  },

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
