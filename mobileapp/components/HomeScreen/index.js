/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var sendSocketRequest = require('../../utils/send-socket-request');
var LocationPanel = require('./LocationPanel');
var SettingsPanel = require('./SettingsPanel');
var WeatherPanel = require('./WeatherPanel');
import Drawer from 'react-native-drawer';



/**
 * Component-specific styles
 */

var STYLES = _.defaults({
  // n/a
}, global.STYLES);






//  ██╗  ██╗ ██████╗ ███╗   ███╗███████╗
//  ██║  ██║██╔═══██╗████╗ ████║██╔════╝
//  ███████║██║   ██║██╔████╔██║█████╗
//  ██╔══██║██║   ██║██║╚██╔╝██║██╔══╝
//  ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗
//  ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
//
module.exports = class HomeScreen extends Component {

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
      weather: {},
      syncing: true,
    };

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
            self.setState({
              syncing: false
            });
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
            remark: data.myRemark,
            syncing: false
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

    fetch(DEFAULT_API_SERVER_BASE_URL+'/make-remark', {
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
};

            // <MapView
            //   style={STYLES.map}
            //   initialRegion={{
            //     latitude: 37.78825,
            //     longitude: -122.4324,
            //     latitudeDelta: 0.0922,
            //     longitudeDelta: 0.0421,
            //   }}
            // />
