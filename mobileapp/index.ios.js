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
  View,
  ListView,
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
 * <RotatingSubHeader>
 *
 * Helper component
 *
 */
class RotatingSubHeader extends Component {

  constructor(props) {
    super(props);
    this.state = {
      seaCreature: props.initialSeaCreature,
    };
    var self = this;
    setInterval(function() {
      self.setState({
        seaCreature: _.sample(['sea anemones', 'mermaids', 'seahorses', 'cuttlefish'])
      });
    }, 4000);
  }

  render() {
    return (
      <Text style={STYLES.subheader}>
        Built for developers by {this.state.seaCreature}
      </Text>
    );
  }

}


/**
 * <mobileapp>
 *
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

export default class mobileapp extends Component {
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
      <View style={STYLES.container}>
        <Image source={ {uri: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Loligo_vulgaris.jpg'} } style={STYLES.brand}/>
        <Text style={STYLES.welcome}>
          A Sails.js/React Native App!
        </Text>
        <View style={STYLES.listViewWrapper}>
          <ListView
            dataSource={this.state.dsOtherUsersHere}
            renderRow={
              (rowData) => <View>
                <Text style={{color: '#FFF', fontWeight: '700', fontSize: 15}}>{rowData.username} says:</Text>
                <Text style={{color: '#C8D0F3', marginBottom: 10, textAlign: 'justify'}}>{rowData.remark}</Text>
              </View>
            }
          />
        </View>
        <RotatingSubHeader initialSeaCreature='cuttlefish' />
      </View>
    );
  }
}

const STYLES = StyleSheet.create({

  container: {
    // height: 400,
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#000',
  },

  brand: {
    flex: 1,
    // width: 200,
    // height: 150,
    // margin: 10,
  },

  welcome: {
    // flex: 1,
    // width: 100,
    // margin: 10,
    //
    padding: 10,
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },

  subheader: {
    // flex: 1,
    // width: 50,
    // margin: 10,
    padding: 10,
    fontSize: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },

  listViewWrapper: {
    flex: 1,
    width: 300,
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: 'auto',
    marginRight: 'auto',
    borderColor: '#C8D0F3',
    borderWidth: 1,
    borderStyle: 'solid',
  }

});

AppRegistry.registerComponent('mobileapp', () => mobileapp);


alert(doStuff());
