/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');


/**
 * Component-specific styles
 */

var STYLES = _.defaults({
  // n/a
}, global.STYLES);



module.exports = class SettingsPanel extends Component {
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
};
// <Image source={{ uri: 'http://maps.googleapis.com/maps/api/staticmap?center='+this.props.lat + ',' + this.props.long + '&zoom=7&size=200x200&key=AIzaSyAvbP5k24nkLhiTp2L8ambymkFWCaS2HvI'}}/>
