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




//  ███████╗██╗ ██████╗ ███╗   ██╗    ██╗   ██╗██████╗
//  ██╔════╝██║██╔════╝ ████╗  ██║    ██║   ██║██╔══██╗
//  ███████╗██║██║  ███╗██╔██╗ ██║    ██║   ██║██████╔╝
//  ╚════██║██║██║   ██║██║╚██╗██║    ██║   ██║██╔═══╝
//  ███████║██║╚██████╔╝██║ ╚████║    ╚██████╔╝██║
//  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═════╝ ╚═╝
//
module.exports = class SignupScreen extends Component {

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
  //       source={{uri: DEFAULT_API_SERVER_BASE_URL+'/signup'}}
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
                  source={require('../images/chatkin-logo-vertical.png')}/>
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
};

