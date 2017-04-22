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





module.exports = class WeatherPanel extends Component {
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
};
