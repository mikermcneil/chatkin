/**
 * Styles
 */


/**
 * importStyles()
 *
 * Get the styles for the chatkin mobile app.
 *
 * @returns {Dictionary}
 */
module.exports = function importStyles () {

  return {

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

}
};
