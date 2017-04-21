/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var sendHttpRequest = require('./utils/send-http-request');
var sendSocketRequest = require('./utils/send-socket-request');

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
io.sails.url = 'http://localhost:1337';
io.sails.query = 'nosession=true';
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
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



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
  AsyncStorage,
  TouchableHighlight,
  WebView,
} from 'react-native';

import Drawer from 'react-native-drawer';
// var MapView = require('react-native-maps');

import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import icoMoonConfig from './utils/icomoon-config.json';
const Icon = createIconSetFromIcoMoon(icoMoonConfig);




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

  renderNavigationScene(route, navigator) {
    switch(route.id) {
      case 'login':
        return (<LoginPage navigator={navigator}/>);
      case 'signup':
          return (<SignupPage navigator={navigator}/>);
      case 'home':
        return (<HomePage navigator={navigator}/>);
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

//  ██╗      ██████╗  ██████╗ ██╗███╗   ██╗
//  ██║     ██╔═══██╗██╔════╝ ██║████╗  ██║
//  ██║     ██║   ██║██║  ███╗██║██╔██╗ ██║
//  ██║     ██║   ██║██║   ██║██║██║╚██╗██║
//  ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║
//  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝
//
class LoginPage extends Component {

  constructor(props) {
    super(props);
    var self = this;
    self.state = {
      username: '',
      password: ''
    };
  }


  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // TODO: replace this with a real test that looks in local storage
  // for a token.  If it does NOT see one, then this device is
  // logged in.  If it does see one, it means the device is probably
  // still logged in.  But we'll check the token by sending it to the
  // server just to make sure.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  signInToChatkin() {
    var self = this;

    var username = self.state.username;
    var password = self.state.password;
    // Talk to the server.
    fetch('http://localhost:1337' + '/login', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Wants-Auth-Token': true
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    })
    .then(function (res) {
      if(+res.status >= 300 || +res.status < 200) {
        console.warn(res.status)
        console.warn(res.headers.get('x-exit'))
        console.warn('You were not logged in.');
        console.warn('username:',username);
        console.warn('password:',password);
        // TODO
        // show error message in UI
        return;
      }
      res.json().then(function(data){
        AsyncStorage.multiSet([
          ['username', data.username],
          ['avatarColor', data.avatarColor],
          ['authToken', res.headers.get('X-Set-Auth-Token')],
        ], function() {
          // alert(res.headers.get('X-Set-Auth-Token'));
          self.props.navigator.replace({ id: 'home' });
        });
      })
      .catch(function(err) {
        console.error(err);
        // alert(err);
      });
    })//</then>
    .catch(function(err){
      console.error(err);
    });
  }

  navigateToSignup(){
    this.props.navigator.replace({ id: 'signup' });
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
                  autoCapitalize="none"
                  onChangeText={
                    (text) => {
                      this.setState({
                        username: text
                      });
                    }
                  }
                />
              </View>
              <View style={STYLES.loginInputWrapper}>
                <TextInput
                  style={STYLES.loginInput}
                  placeholder="Password"
                  secureTextEntry={true}
                  onChangeText={
                    (text) => {
                      this.setState({
                        password: text
                      });
                    }
                  }
                />
              </View>
              <View style={STYLES.submitButtonWrapper}>
                <Button
                  color="#fff"
                  onPress={ this.signInToChatkin.bind(this) }
                  title='Sign in'
                />
              </View>
              <Text
                style={{ textAlign: 'center', color: '#90b63e', fontWeight: 'bold', marginTop: 15 }}
                onPress={ this.navigateToSignup.bind(this) }>
                Create an account
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

//  ███████╗██╗ ██████╗ ███╗   ██╗    ██╗   ██╗██████╗
//  ██╔════╝██║██╔════╝ ████╗  ██║    ██║   ██║██╔══██╗
//  ███████╗██║██║  ███╗██╔██╗ ██║    ██║   ██║██████╔╝
//  ╚════██║██║██║   ██║██║╚██╗██║    ██║   ██║██╔═══╝
//  ███████║██║╚██████╔╝██║ ╚████║    ╚██████╔╝██║
//  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═════╝ ╚═╝
//
class SignupPage extends Component {

  constructor(props) {
    super(props);
    var self = this;
    // Get the initial randomized avatar color.
    var startingRed = (Math.floor(Math.random()*255));
    var startingGreen = (Math.floor(Math.random()*255));
    var startingBlue = (Math.floor(Math.random()*255));
    self.state = {
      avatarColor: 'rgb('+startingRed+','+startingGreen+','+startingBlue+')',
      username: '',
      password: '',
      confirmPassword: '',
    };

  }

  randomizeAvatarColor() {
    // Get the initial randomized avatar color.
    var newRed = (Math.floor(Math.random()*255));
    var newGreen = (Math.floor(Math.random()*255));
    var newBlue = (Math.floor(Math.random()*255));

    this.setState({
      avatarColor: 'rgb('+newRed+','+newGreen+','+newBlue+')'
    });
  }

  navigateToLogin(){
    this.props.navigator.replace({ id: 'login' });
  }

  submitSignupForm() {
    //...
  }

  // If we want you to just go to chatkin.com to signup, could try something like:
  // ```
  // render() {
  //   return (
  //     <WebView
  //       source={{uri: 'http://localhost:1337'+'/signup'}}
  //     />
  //   );
  // }
  // ```

  render() {
    let backgroundStyle = { backgroundColor: this.state.avatarColor };
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
                  placeholder="Choose a username"
                />
              </View>
              <View style={STYLES.loginInputWrapper}>
                <TextInput
                  style={STYLES.loginInput}
                  placeholder="Password"
                  secureTextEntry={true}
                />
              </View>
              <View style={STYLES.loginInputWrapper}>
                <TextInput
                  style={STYLES.loginInput}
                  placeholder="Confirm password"
                  secureTextEntry={true}
                />
              </View>
              <View style={STYLES.avatarColorPicker}>
                <Text>Avatar color:</Text>
                <View style={[{width: 25, height: 25}, backgroundStyle]}/>
                <Text onPress={ this.randomizeAvatarColor.bind(this) }>change</Text>
              </View>
              <View style={STYLES.submitButtonWrapper}>
                <Button
                  color="#fff"
                  onPress={ this.submitSignupForm }
                  title='Sign up'
                />
              </View>
              <Text
                style={{ textAlign: 'center', color: '#90b63e', fontWeight: 'bold', marginTop: 15 }}
                onPress={ this.navigateToLogin.bind(this) }>
               Log in to existing account
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
}


//  ██╗  ██╗ ██████╗ ███╗   ███╗███████╗
//  ██║  ██║██╔═══██╗████╗ ████║██╔════╝
//  ███████║██║   ██║██╔████╔██║█████╗
//  ██╔══██║██║   ██║██║╚██╔╝██║██╔══╝
//  ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗
//  ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
//
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
    self.state = {
      ds: ds,
      dsOtherUsersHere: ds.cloneWithRows([]),
      otherUsersHere: [],
      latitude: 0,
      longitude: 0,
      username: '',
      remark: '',
      avatarColor: '#000',
      authToken: '',
      pendingRemark: '',
      editingRemark: false,
      weather: {}
    };

    // TODO: loading state
    AsyncStorage.multiGet(['username', 'avatarColor', 'authToken'], function(err, stores) {
      if(err) {
        console.error('AsyncStorage error: ' + error.message);
        return;
      }

      // NOTE:
      // `stores` is either `null`, or a 2-dimensional array like:
      // [ ['username','billy'], ['remark', 'hey guys'], .... ]

      // If we don't have any of this stuff already stored,
      // redirect to the login screen.
      if (_.isNull(stores)){
        self.props.navigator.replace({ id: 'login' });
        return;
      }

      // Otherwise we've already got this user's data stored so we can proceed
      // with slapping it on the page.

      // Make our data into a nice, readable dictionary.
      var userData = {};
      _.each(stores, function(store) {
        // The items returned from .multiGet() are ALSO arrays that look like:
        // [key, value]
        var key = store[0];
        var value = store[1];
        userData[key] = value;
      });
      self.setState(userData);

      // Get our position.
      navigator.geolocation.getCurrentPosition(function(position) {
        self.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        sendSocketRequest({
          method: 'PUT',
          url: '/arrive',
          headers: { 'X-Auth-Token': userData.authToken },
          body: {
            lat: position.coords.latitude,
            long: position.coords.longitude
          }
        }, function (err, resInfo) {
          if (err) {
            // If the user is not authenticated, redirect to the login page.
            if (err.code === 'E_NON_200_RESPONSE' && err.headers.get('x-exit') === 'notAuthenticated') {
              self.props.navigator.replace({ id: 'login' });
            }
            // If online, show a custom state in the user interface.
            else if (err.code === 'E_OFFLINE') {
              // TODO: offline state (for now just log warning)
              console.warn(err);
            }
            // Some other unexpected error (i.e. prbly bug)
            else {
              console.error(err);
            }
            return;
          }//-•

          var data = resInfo.data;
          self.setState({
            dsOtherUsersHere: ds.cloneWithRows(data.otherUsersHere),
            otherUsersHere: _.clone(data.otherUsersHere),
            weather: data.weather,
            pendingRemark: data.myRemark,
            remark: data.myRemark
          });
        });//</ sendSocketRequest() >


        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: Set up cloud sdk implementation for react native:
        // ```
        // Cloud.arrive({
        //   lat: position.coords.latitude,
        //   long: position.coords.longitude
        // }).exec({
        //   error: function(err) {
        //     console.error(err);
        //   },
        //   notAuthenticated: function (err){
        //     self.props.navigator.replace({ id: 'login' });
        //   },
        //   success: function (data){
        //     self.setState({
        //       otherUsersHere: ds.cloneWithRows(data.otherUsersHere),
        //       weather: data.weather,
        //       pendingRemark: data.myRemark,
        //       remark: data.myRemark
        //     });
        //   }
        // });
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


      });//</get position>

    });//</ AsyncStorage.multiGet() >

  }


  componentDidMount() {

    var self = this;

    // Every time a "zone" socket event from the server arrives...
    io.socket.on('zone', function(msg){
      // console.warn('* * Received zone notification from server with message:', msg);

      // If this notification is about a user leaving the zone, remove the user
      // from the user interface.
      if (msg.verb === 'userLeft') {
        // TODO

        // // If this notification is about the currently logged-in user,
        // // just ignore it.
        // // (This can happen if a user has multiple tabs open.)
        // if(msg.username === self.state.username) { return; }

        // console.log('there are '+vm.zone.otherUsersHere.length+'other users here.');
        // console.log(msg.username+' left.');


        // // Remove the user from the list of other users in the zone.
        // vm.removeUserFromZone(msg.username);
        // console.log('NOW there are '+vm.zone.otherUsersHere.length+'other users here.');
      }
      // If it's about a new user joining the zone, add that user
      // to the UI.
      else if (msg.verb === 'userArrived') {
        // TODO

        // If this notification is about the currently logged-in user,
        // just ignore it.
        if(msg.username === self.state.username) { return; }
        // Also, if this notification is about a user who is already here,
        // ignore it.
        var userInZone = _.find(self.state.otherUsersHere, {username: msg.username});
        // alert('USER ARRIVED:'+JSON.stringify(userInZone));
        if(!_.isUndefined(userInZone)) { return; }

        // Add the newly-arrived user to our list of `otherUsersHere`.
        data = [msg].concat(self.state.otherUsersHere)
        self.setState({
          dsOtherUsersHere: self.state.ds.cloneWithRows(data),
          otherUsersHere: data
        });
      }
      // If this is about a user in this zone updating their remark,
      // update the remark in the UI.
      else if(msg.verb === 'userRemarked') {
        // If this notification is about the currently logged-in user,
        // just ignore it.
        // (This can happen if a user has multiple tabs open.)
        if(msg.username === self.state.username) { return; }

        // Make a shallow copy of the user data.
        var userDataCopy = _.clone(self.state.otherUsersHere);
        // Find the user in the copied list and update the remark.
        var userInZone = _.clone(_.find(userDataCopy, {username: msg.username}));
        userInZone.remark = msg.remark;

        _.remove(userDataCopy, {username: msg.username});
        userDataCopy.unshift(userInZone);

        // Update the listview data source + readable data
        self.setState({
          dsOtherUsersHere: self.state.ds.cloneWithRows(userDataCopy),
          otherUsersHere: userDataCopy
        });
      }
      // Otherwise, we don't know wtf it is.
      else { throw new Error('Consistency violation: Unrecognized message received in "zone" socket event handler: '+JSON.stringify(msg)); }
    });//</ .on('zone') >
  }

  componentWillUnmount() {
    // console.warn('componentWillUnmount LC fired for home screen')
    io.socket.off('zone');
  }


  renderUserRemarkSection = function() {
    var self = this;

    if(self.state.editingRemark) {
      return (
        <TextInput
          style={ STYLES.textInput }
          value={ this.state.pendingRemark }
          placeholder="Update your message!"
          onChangeText={
            (text) => {
              this.setState({
                pendingRemark: text
              });
            }
          }
          onSubmitEditing={ this.updateRemark.bind(this) }
        />
      );
    }
    else {
      return (
        <TouchableHighlight onPress={ this.enableEditRemark.bind(this) }>
          <View>
            <Text style={{ fontWeight: 'bold', color: this.state.avatarColor }}>You say:</Text>
            <Text>{ this.state.remark }</Text>
          </View>
        </TouchableHighlight>
      );
    }
  };

  enableEditRemark = function() {
    var self = this;
    self.setState({editingRemark: true})
  };


  updateRemark = function() {
    var self = this;

    fetch('http://localhost:1337'+'/make-remark', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': self.state.authToken
      },
      body: JSON.stringify({
        username: self.state.username,
        remark: self.state.pendingRemark
      })
    })
    .then(function (res) {
      if(res.status >= 300 || res.status < 200) {
        console.error(res)
        return;
      }
      // Otherwise, set the remark section to its inactive state.
      self.setState({
        remark: self.state.pendingRemark,
        editingRemark: false
      });
    })//</then>
    .catch(function(err){
      console.error(err);
      // alert(err);
    });
  };


  closePanel = () => {
    this._drawer.close()
  };
  openWeatherPanel = () => {
    this.setState({drawerContent: 'weather'})
    this._drawer.open();
  };
  openLocationPanel = () => {
    this.setState({drawerContent: 'location'})
    this._drawer.open();
  };
  openSettingsPanel = () => {
    this.setState({drawerContent: 'settings'})
    this._drawer.open();
  };

  // scrollPanelRight = () => {
  //   switch this.state.drawerContent {
  //     case 'weather':
  //       this.setState({drawerContent: 'location'});
  //       break;
  //     case 'location':
  //       this.setState({drawerContent: 'settings'});
  //       break;
  //   }
  // };
  // scrollPanelLeft = () => {
  //   switch this.state.drawerContent {
  //     case 'settings':
  //       this.setState({drawerContent: 'location'});
  //       break;
  //     case 'location':
  //       this.setState({drawerContent: 'weather'});
  //       break;
  //   }
  // };



  render() {

    return (
      <Drawer
        type="displace"
        side="right"
        ref={(ref) => this._drawer = ref}
        openDrawerOffset={100}
        tapToClose={true}
        tweenHandler={Drawer.tweenPresets.parallax}
        content={
          this.state.drawerContent === 'weather' ? <WeatherPanel weather={this.state.weather}/> : this.state.drawerContent === 'location' ? <LocationPanel lat={this.state.latitude} long={this.state.longitude}/> : <SettingsPanel username={this.state.username} avatarColor={this.state.avatarColor} navigator={this.props.navigator}/>
        }>
        <KeyboardAvoidingView
          behavior='padding'
          style={STYLES.container}
          noScroll={true}>
          <View style={STYLES.topbar}>
            <Text style={STYLES.topbarBrand}>chatkin</Text>
            <View style={STYLES.topbarIcons}>
              <Icon
                onPress={this.openSettingsPanel}
                name="gear"
                size={22}
                color="#90B63E"/>
              <Icon
                onPress={this.openWeatherPanel}
                name={this.state.weather.iconClass ? this.state.weather.iconClass : 'weather-03d'}
                size={22}
                color={this.state.weather.iconClass ? '#90B63E' : '#fff'} />
              <Icon
                onPress={this.openLocationPanel}
                name="location"
                size={20}
                color="#90B63E" />
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
            { this.renderUserRemarkSection() }
          </View>
        </KeyboardAvoidingView>
      </Drawer>
    );
  }


  renderListViewHeader = function(rowData) {
    return(<View style={{height: 10}}/>);
  };

  renderListViewRow = function(rowData) {
    return(
      <View style={{flex: 1, flexDirection: 'row'}}>
        <View style={{width: 45, paddingTop: 10}}>
          <Icon
            name="logo-chatkin"
            size={30}
            color={rowData.avatarColor} />
        </View>
        <View style={{flex: 1}}>
          <Text
            style={[ STYLES.chatHeader, {color: rowData.avatarColor} ]}>
            {(function(twitterUsername) {
              if(twitterUsername) {
                return(
                  <Icon
                    name="social-twitter"
                    size={16}
                    color={rowData.avatarColor} />
                );
              }
            })(rowData.twitterUsername)}
            <Text style={{paddingLeft: 5}}>{ rowData.twitterUsername ? '@'+rowData.twitterUsername : rowData.username }</Text>
          </Text>
          <Text
            style={STYLES.chatBody}>
            { rowData.remark }
          </Text>
        </View>
      </View>
    );
  };

  renderListViewFooter = function(rowData) {
    return(<View style={{height: 25}}/>);
  };
}

class WeatherPanel extends Component {
  render() {
    return(
      <View style={STYLES.panelWrapper}>
        <Text style={STYLES.panelHeader}>Weather: {this.props.weather.description}</Text>
        <Text style={{fontSize: 16, marginBottom: 10}}>{ this.props.weather.temp } &deg; Kelvin</Text>
        <Text><Text style={{fontWeight:'bold'}}>High:</Text> { this.props.weather.temp_max } &deg; K</Text>
        <Text><Text style={{fontWeight:'bold'}}>Low:</Text> { this.props.weather.temp_min } &deg; K</Text>
      </View>
    );
  }
}

// TODO: get the coordinates in here:
// <Image source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center='+this.props.lat + ',' + this.props.long + '&zoom=7&size=200x200&key=AIzaSyAvbP5k24nkLhiTp2L8ambymkFWCaS2HvI'}}/>
// see https://developers.google.com/maps/documentation/static-maps/intro for more info
class LocationPanel extends Component {
  render() {
    return(
      <View style={STYLES.panelWrapper}>
        <Text style={STYLES.panelHeader}>Location Info</Text>
        <View style={{flex: 1}}>
          <View style={STYLES.mapWrapper}>
          </View>
        </View>
      </View>
    );
  }
}
            // <MapView
            //   style={STYLES.map}
            //   initialRegion={{
            //     latitude: 37.78825,
            //     longitude: -122.4324,
            //     latitudeDelta: 0.0922,
            //     longitudeDelta: 0.0421,
            //   }}
            // />

class SettingsPanel extends Component {
  // constructor(props) {
  //   super(props);
  //   var self = this;
  // }

  render() {
    return(
      <View style={STYLES.panelWrapper}>
        <Text style={{textAlign: 'center'}}>
          <Icon
            name="logo-chatkin"
            size={42}
            color={this.props.avatarColor} />
        </Text>
        <Text style={{textAlign: 'center', marginBottom: 20}}>Logged in as {this.props.username}</Text>
        <TouchableHighlight onPress={function() {
            AsyncStorage.removeItem('authToken', function() {
              // this.props.navigator.replace({id: 'login'});
            });
          }}>
          <Text style={{textAlign: 'center'}}>Sign out</Text>
        </TouchableHighlight>
      </View>
    );
  }
}
// <Image source={{ uri: 'http://maps.googleapis.com/maps/api/staticmap?center='+this.props.lat + ',' + this.props.long + '&zoom=7&size=200x200&key=AIzaSyAvbP5k24nkLhiTp2L8ambymkFWCaS2HvI'}}/>

//  ███████╗████████╗██╗   ██╗██╗     ███████╗███████╗
//  ██╔════╝╚══██╔══╝╚██╗ ██╔╝██║     ██╔════╝██╔════╝
//  ███████╗   ██║    ╚████╔╝ ██║     █████╗  ███████╗
//  ╚════██║   ██║     ╚██╔╝  ██║     ██╔══╝  ╚════██║
//  ███████║   ██║      ██║   ███████╗███████╗███████║
//  ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚══════╝╚══════╝
//
const STYLES = StyleSheet.create({

    mapWrapper: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#fff',
    },

    map: {
      ...StyleSheet.absoluteFillObject,
    },

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
      fontFamily: 'Comfortaa',
      color: '#90B63E',
      fontSize: 26,
      fontWeight: 'bold',
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

    drawer: {
     shadowColor: '#000000',
     shadowOpacity: 0.8,
     shadowRadius: 3
   },

   panelWrapper: {
    flex: 1,
    backgroundColor: '#bdcdd5',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 55,
    paddingBottom: 25,
   },

   panelHeader: {
    color: '#000',
    fontSize: 24,
    marginBottom: 10,
   },

  }
);

AppRegistry.registerComponent('mobileapp', () => mobileapp);

