/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var doStuff = require('./utils/do-stuff');
import React, { Component } from 'react';
import Drawer from 'react-native-drawer'
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
      case 'signup':
          return (<SignupPage navigator={navigator}/>);
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

//  ██╗      ██████╗  ██████╗ ██╗███╗   ██╗
//  ██║     ██╔═══██╗██╔════╝ ██║████╗  ██║
//  ██║     ██║   ██║██║  ███╗██║██╔██╗ ██║
//  ██║     ██║   ██║██║   ██║██║██║╚██╗██║
//  ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║
//  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝
//
class LoginPage extends Component {

  signInToChatkin() {
    // // Talk to the server.
    // // fetch('http://192.168.1.19:1337/test', {
    // fetch('http://localhost:1337/login', {
    //   headers: {
    //     'Content-Type': 'application/json',
    //   }
    // })
    // .then(function (res) {
    //   // TODO

    // })//</then>
    // .catch(function(err){
    //   console.error(err);
    //   alert(err);
    // });


    this.props.navigator.replace({ id: 'home' });
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

  updateUsername() {
    alert(event);
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
          this.state.drawerContent === 'weather' ? <WeatherPanel/> : <LocationPanel/>
        }>
        <KeyboardAvoidingView
          behavior='padding'
          style={STYLES.container}
          noScroll={true}>
          <View style={STYLES.topbar}>
            <Image style={STYLES.topbarBrand}
              source={require('./images/chatkin-logo.png')}/>
            <View style={STYLES.topbarIcons}>
              <Text onPress={this.openWeatherPanel}>(W)</Text>
              <Text onPress={this.openLocationPanel}>(L)</Text>
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
      </Drawer>
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

class WeatherPanel extends Component {
  render() {
    return(
      <View style={STYLES.panelWrapper}>
        <Text style={STYLES.panelHeader}>Weather Info</Text>
      </View>
    );
  }
}

class LocationPanel extends Component {
  render() {
    return(
      <View style={STYLES.panelWrapper}>
        <Text style={STYLES.panelHeader}>Location Info</Text>
      </View>
    );
  }
}

//  ███████╗████████╗██╗   ██╗██╗     ███████╗███████╗
//  ██╔════╝╚══██╔══╝╚██╗ ██╔╝██║     ██╔════╝██╔════╝
//  ███████╗   ██║    ╚████╔╝ ██║     █████╗  ███████╗
//  ╚════██║   ██║     ╚██╔╝  ██║     ██╔══╝  ╚════██║
//  ███████║   ██║      ██║   ███████╗███████╗███████║
//  ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚══════╝╚══════╝
//
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
    paddingTop: 25,
    paddingBottom: 25,
   },

   panelHeader: {
    color: '#000',
    fontSize: 24
   },

  }
);

AppRegistry.registerComponent('mobileapp', () => mobileapp);


// alert(doStuff());
