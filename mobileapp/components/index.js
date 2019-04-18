//  ██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗
//  ██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝
//  ██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗
//  ██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝
//  ╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗
//   ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
//
//  ████████╗ ██████╗     ████████╗██╗  ██╗███████╗
//  ╚══██╔══╝██╔═══██╗    ╚══██╔══╝██║  ██║██╔════╝
//     ██║   ██║   ██║       ██║   ███████║█████╗
//     ██║   ██║   ██║       ██║   ██╔══██║██╔══╝
//     ██║   ╚██████╔╝       ██║   ██║  ██║███████╗
//     ╚═╝    ╚═════╝        ╚═╝   ╚═╝  ╚═╝╚══════╝
//
//    ██╗██╗  ██╗ █████╗  ██████╗██╗  ██╗    ███████╗██╗  ██╗ █████╗  ██████╗██╗  ██╗██╗
//   ██╔╝██║  ██║██╔══██╗██╔════╝██║ ██╔╝    ██╔════╝██║  ██║██╔══██╗██╔════╝██║ ██╔╝╚██╗
//  ██╔╝ ███████║███████║██║     █████╔╝     ███████╗███████║███████║██║     █████╔╝  ╚██╗
//  ╚██╗ ██╔══██║██╔══██║██║     ██╔═██╗     ╚════██║██╔══██║██╔══██║██║     ██╔═██╗  ██╔╝
//   ╚██╗██║  ██║██║  ██║╚██████╗██║  ██╗    ███████║██║  ██║██║  ██║╚██████╗██║  ██╗██╔╝
//    ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝
//================================================================================================================

//
// To avoid including incredibly long import blocks at the top of each file:
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// We expose them as globals
import React, { Component } from 'react';
global.React = React;
global.Component = Component;

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
  AsyncStorage,
  TouchableHighlight,
  WebView,
} from 'react-native';

global.AppRegistry = AppRegistry;
global.StyleSheet = StyleSheet;
global.Text = Text;
global.Image = Image;
global.KeyboardAvoidingView = KeyboardAvoidingView;
global.View = View;
global.ListView = ListView;
global.ScrollView = ScrollView;
global.TextInput = TextInput;
global.Navigator = Navigator;
global.Button = Button;
global.AsyncStorage = AsyncStorage;
global.TouchableHighlight = TouchableHighlight;
global.WebView = WebView;

import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import icoMoonConfig from '../utils/icomoon-config.json';
var Icon = createIconSetFromIcoMoon(icoMoonConfig);
global.Icon = Icon;


global.STYLES = require('../styles');

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
global.DEFAULT_API_SERVER_BASE_URL = 'https://chatkin.com';
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


// ============================================================================================
// For sockets to work:
// ============================================================================================
// Instead of:
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
// import SocketIOClient from 'socket.io-client';
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ...
// ...we have to do:
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
// You need to set `window.navigator` to something in order to use the socket.io
// client. You have to do it like this in order to use the debugger because the
// debugger in React Native runs in a webworker and only has a getter method for
// `window.navigator`.
window.navigator.userAgent = 'ReactNative';

// Need to require instead of import so we can set the user agent first
// This must be below your `window.navigator` hack above
var SocketIOClient = require('socket.io-client');
var SailsIOClient = require('sails.io.js');
// - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Instantiate the socket client (`io`)
// (for now, you must explicitly pass in the socket.io client when using this library from Node.js)
io = window.io = SailsIOClient(SocketIOClient);

// Set some options:
// (you have to specify the host and port of the Sails backend when using this library from Node.js)
io.sails.url = DEFAULT_API_SERVER_BASE_URL;
io.sails.query = 'nosession=true';
io.sails.useCORSRouteToGetCookie = false;
// ============================================================================================



// Hack to help catch bugs during development:
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(function(){
  var _originalAlert = window.alert;
  alert = window.alert = function (){
    if (arguments.length > 1) { throw new Error('alert() only takes one argument!'); }
    _originalAlert.apply(this, Array.prototype.slice.call(arguments));
  };


  // FUTURE: maybe do this too:
  // var _originalError = window.Error;
  // Error = window.Error = function FakeErrorConstructor(){
  //   if (arguments.length > 1) { throw new Error('new Error() only takes one argument!  At least in our app.'); }
  //   _originalError.apply(this, Array.prototype.slice.call(arguments));
  // }

})();




//    ██╗    ██╗██╗  ██╗ █████╗  ██████╗██╗  ██╗    ███████╗██╗  ██╗ █████╗  ██████╗██╗  ██╗██╗
//   ██╔╝   ██╔╝██║  ██║██╔══██╗██╔════╝██║ ██╔╝    ██╔════╝██║  ██║██╔══██╗██╔════╝██║ ██╔╝╚██╗
//  ██╔╝   ██╔╝ ███████║███████║██║     █████╔╝     ███████╗███████║███████║██║     █████╔╝  ╚██╗
//  ╚██╗  ██╔╝  ██╔══██║██╔══██║██║     ██╔═██╗     ╚════██║██╔══██║██╔══██║██║     ██╔═██╗  ██╔╝
//   ╚██╗██╔╝   ██║  ██║██║  ██║╚██████╗██║  ██╗    ███████║██║  ██║██║  ██║╚██████╗██║  ██╗██╔╝
//    ╚═╝╚═╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝
//
//================================================================================================================




/**
 * Module dependencies
 */

var LoginScreen = require('./LoginScreen');
var SignupScreen = require('./SignupScreen');
var HomeScreen = require('./HomeScreen');




/**
 * <mobileapp>
 *
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

export default class mobileapp extends Component {

  renderNavigationScene(route, navigator) {
    switch(route.id) {
      case 'login':
        return (<LoginScreen navigator={navigator}/>);
      case 'signup':
          return (<SignupScreen navigator={navigator}/>);
      case 'home':
        return (<HomeScreen navigator={navigator}/>);
      default:
        throw new Error('Consitency violation: this is not a route: '+route.id);
    }
  }

  render() {
    return(
      <Navigator
      initialRoute={{ id: 'home' }}
      renderScene={ this.renderNavigationScene }
      />
    );
  }
}


AppRegistry.registerComponent('mobileapp', () => mobileapp);

