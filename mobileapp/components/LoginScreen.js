/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var sendSocketRequest = require('../utils/send-socket-request');


/**
 * Component-specific styles
 */

var STYLES = _.defaults({
  // n/a
}, global.STYLES);




//  ██╗      ██████╗  ██████╗ ██╗███╗   ██╗
//  ██║     ██╔═══██╗██╔════╝ ██║████╗  ██║
//  ██║     ██║   ██║██║  ███╗██║██╔██╗ ██║
//  ██║     ██║   ██║██║   ██║██║██║╚██╗██║
//  ███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║
//  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝
//
module.exports = class LoginScreen extends Component {

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
    fetch(DEFAULT_API_SERVER_BASE_URL + '/login', {
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
                  source={require('../images/chatkin-logo-vertical.png')}/>
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
};
