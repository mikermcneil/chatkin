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



// TODO: get the coordinates in here:
// <Image source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center='+this.props.lat + ',' + this.props.long + '&zoom=7&size=200x200&key=AIzaSyAvbP5k24nkLhiTp2L8ambymkFWCaS2HvI'}}/>
// see https://developers.google.com/maps/documentation/static-maps/intro for more info
module.exports = class LocationPanel extends Component {
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
};
