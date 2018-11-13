import React, { Component } from "react";
import { connect } from "react-redux";
import { TouchableOpacity, View, Dimensions, Image, TextInput, ScrollView, Alert, Modal, AsyncStorage, NetInfo } from "react-native";
import {
  Container,
  Header,
  Title,
  Content,
  Text,
  Button,
  Icon,
  Left,
  Right,
  Body, Tab, Tabs, TabHeading, Input, Picker, Form, Item
} from "native-base";
import styles from "./styles";
import Spinner from 'react-native-loading-spinner-overlay';
import {URLclass} from '../lib/';
import MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import { send_photoArray, send_deleted_photoArray, send_editPhoto, send_clickPhoto, send_typeList, send_tagList, send_claimStatus, send_date, send_taskList } from "../../actions/user";
import moment from 'moment';
import CalendarPicker from 'react-native-calendar-picker';


const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

const person_icon = require("../../../images/person.png");
const insured_icon = require("../../../images/insured_icon.png");
const phone_icon = require("../../../images/phone.png");
const claim_icon = require("../../../images/claim.png");
const policy_icon = require("../../../images/policy.png");
const calendar_icon = require("../../../images/calendar.png");
const pin_icon = require("../../../images/pin_icon.png");
const camera_icon = require("../../../images/camera.png");
const more_icon = require("../../../images/more.png");
const remove_icon = require("../../../images/remove.png");

class BlankPage extends Component {
  static navigationOptions = {
    header: null
  };
  static propTypes = {
    name: React.PropTypes.string,
    index: React.PropTypes.number,
    list: React.PropTypes.arrayOf(React.PropTypes.string),
    openDrawer: React.PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      spinner_visible: false,
      photo_array: [],
      quote_description: "nonono$$$",
      modalVisible: false,
      modalVisible_map: false,
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      },
      markerRegion: {
        latitude: 37.78825,
        longitude: -122.4324
      },
      status: "PENDING",
      foo: '',
      saved_claimDataList : null,
      saved_detailedData: null,
      selectedTabNum: 0,
      is_saveButton_enable: true,

      is_photo_later: false,
      saved_insp_batchdetail_pk: 1,
      saved_inspectioninfo_pk: 1,
      saved_tag_pk: 1,
      saved_tag_group_pk: 1,
      saved_description: "",
      saved_Filedata: [],
      saved_userID: 1,

      saved_photos_list_for_upload: [],
      duration: 0,
      timesheet_date: moment(new Date()).format("MMM DD, YYYY"),
      is_clockIn: false,
      selectedStartDate: null,
      selectedEndDate: null,
    };
    this.DoEditPhoto = this.DoEditPhoto.bind(this);
    this.DoDeletePhoto = this.DoDeletePhoto.bind(this);
    this.DoClickPhoto = this.DoClickPhoto.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
  }

  componentWillMount() {
    if (this.props.claim_status == "no") {
      this.setState({is_saveButton_enable: false})
    }

    AsyncStorage.getItem("saved_claimNumber").then((value) => {
      if (value != null) {
        var temp_temp = "saved_claim_count" + value.toString()
        AsyncStorage.getItem(temp_temp).then((count) => {
          if (count == null) {
            var zero = 0
            AsyncStorage.setItem(temp_temp, zero.toString());
          }
        }).done();
      }
    }).done()

    {this.getFirstData()}

  }

  componentDidMount() {
  }

  getFirstData() {
    AsyncStorage.getItem("saved_data").then((value) => {
        this.setState({saved_claimDataList: JSON.parse(value)})
    }).done();
    

    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.state.saved_detailedData = this.props.claim_detail
        if (this.state.quote_description != this.props.claim_detail.interview_summary) {
          if (this.state.quote_description == "nonono$$$") {
            this.state.quote_description = this.props.claim_detail.interview_summary
          }
        } else {
          this.state.quote_description = this.props.claim_detail.interview_summary
        }
        
        this.setState({spinner_visible:true})
        var photo_url = URLclass.url + 'getImages'
        var formData = new FormData();
        formData.append("inspectioninfo_pk", this.props.claim_data.claim_list[this.props.claim_number].InspectionInfoId_PK)
        formData.append("insp_batchdetail_pk", this.props.claim_data.claim_list[this.props.claim_number].InspBatchDetailId_PK)
        fetch(photo_url, {
          method: 'POST',
          body: formData
        })
        .then((response) => response.json())
        .then((responseData) => {
          if (responseData.status == 1) {
            this.setState({spinner_visible:false})
            this.props.send_photoArray(responseData.image_list)
            {this.getTagTypeList()}
            // this.setState({photo_array: responseData.image_list})
          } else {
            var self=this
            self.setState({spinner_visible:false})
            this.props.send_photoArray(responseData.image_list)
            {this.getTagTypeList()}
            // setTimeout(function(){
            //   Alert.alert("There are no photos.")
            //   }, 300); 
            }
          })
        .catch(function(error) {
          return error;
        })
      } else {
        var temp_key;
        AsyncStorage.getItem("saved_claimNumber").then((value) => {
          temp_key = "saved_claimDetailData" + value.toString()
          AsyncStorage.getItem(temp_key).then((value) => {
            if (value != null) {
              var sss = JSON.parse(value)
              this.setState({saved_detailedData: sss})
              this.setState({quote_description: sss.interview_summary})

              {this.getTagTypeList()}
            } else {
              this.setState({quote_description: ""})              
              Alert.alert("This claim doesn't have detailed data in local.")
            }
          }).done();
        }).done();

        var empty_array = []
        this.props.send_photoArray(empty_array)
        Alert.alert('Photos will be showed in online.')
      }
    })
  }

  getTagTypeList() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.setState({spinner_visible:true})
        var task_url = URLclass.url + 'getTags'
        var formData = new FormData();
        formData.append("insp_batchdetail_pk", this.props.claim_data.claim_list[this.props.claim_number].InspBatchDetailId_PK)
        fetch(task_url, {
          method: 'POST',
          body: formData
        })
        .then((response) => response.json())
        .then((responseData) => {
          if (responseData.status == 1) {
            this.setState({spinner_visible:false})
            this.props.send_typeList(responseData.group_list)
            AsyncStorage.setItem('saved_typeList', JSON.stringify(responseData.group_list));
            this.props.send_tagList(responseData.tag_list)
            AsyncStorage.setItem('saved_tagList', JSON.stringify(responseData.tag_list));

            
          } else {
            var self=this
            self.setState({spinner_visible:false})
            setTimeout(function(){
              Alert.alert("There is no claim data.")
              }, 300); 
          }
        })
        .catch(function(error) {
          return error;
        })
      } else {
        AsyncStorage.getItem("saved_tagList").then((value) => {
          if (value == null) {
            Alert.alert("There are no data for tags in local.")
          } else {
            // this.setState({tag_list: JSON.parse(value)})
            var temppp = JSON.parse(value)
            this.props.send_tagList(temppp)
          }
        }).done();
        AsyncStorage.getItem("saved_typeList").then((value) => {
          if (value == null) {
            Alert.alert("There are no data for types in local.")
          } else {
            this.props.send_typeList(JSON.parse(value))
          }
        }).done();
      }
    })
  }

  handleOnNavigateBack = (foo) => {
    this.setState({
      foo
    })
  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});
  }

  setModalVisible_map(visible) {
    this.setState({modalVisible_map: visible})
  }

  DoDeletePhoto(_counterFromChild) {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.setState({spinner_visible:true})
        var photo_url = URLclass.url + 'deleteImage'
        var formData = new FormData();
        formData.append("inspfileuploadtempid_pk", this.props.photo_array[_counterFromChild].inspfileuploadid_pk)
        formData.append("is_temp_image", "true")
        fetch(photo_url, {
          method: 'POST',
          body: formData
        })
        .then((response) => response.json())
        .then((responseData) => {
          if (responseData.status == 1) {
            this.setState({spinner_visible:false})
            this.getFirstData()
            // this.props.send_deleted_photoArray(_counterFromChild)
            // this.setState({photo_array: responseData.image_list})
          } else {
            var self=this
            self.setState({spinner_visible:false})
            // setTimeout(function(){
            //   Alert.alert("There are no photos.")
            //   }, 300); 
            }
          })
        .catch(function(error) {
          return error;
        })
      } else {
        Alert.alert("You can't delete photo in offline.")
      }
    })
  }

  DoEditPhoto(_counterFromChild) {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.props.send_editPhoto(this.props.photo_array[_counterFromChild])
        this.props.navigation.navigate('CameraPage', {
          onNavigateBack: this.handleOnNavigateBack.bind(this)
        })
      } else {
        Alert.alert("You can't edit photo in offline.")
      }
    })
  }

  DoClickPhoto(_counterFromChild) {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.props.send_clickPhoto(this.props.photo_array[_counterFromChild])
        this.props.navigation.navigate("PhotoPage")
      } else {
        Alert.alert("You can't see the detailed photo in offline.")
      }
    })
  }

  change_status(value: string) {
    this.setState({
      status: value
    });
  }

  onDateChange(date, type) {
    if (type === 'END_DATE') {
      this.setState({
        selectedEndDate: moment(date).format("MMM DD, YYYY"),
      });
    } else {
      this.setState({
        selectedStartDate: moment(date).format("MMM DD, YYYY"),
        selectedEndDate: null,
      });
    }
  }

  click_todayBtn() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.props.send_date(moment(new Date()).format("MM/DD/YYYY"))
        this.props.navigation.navigate("TodayPage")
      } else {
        Alert.alert("You can't use this function in offline mode.")
      }
    })
    
  }
  
  click_customDateBtn() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.setModalVisible(true)
      } else {
        Alert.alert("You can't use this function in offline mode.")
      }
    })
  }

  click_OKBtn() {
    this.setModalVisible(false)

    var startDate = new Date(this.state.selectedStartDate); //YYYY-MM-DD
    var endDate = new Date(this.state.selectedEndDate); //YYYY-MM-DD

     ////////////// GET DATE array between 2 days
    var getDateArray = function(start, end) {
        var arr = new Array();
        var dt = new Date(start);
        while (dt <= end) {
            arr.push(new Date(dt));
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    }
    var dateArr = getDateArray(startDate, endDate);


    if (this.state.selectedEndDate == null) {
      Alert.alert("Please select the days.")
    } else {
      this.setState({spinner_visible:true})
      var list_url = URLclass.url + 'getTaskListDetails'
      var formData = new FormData();
      formData.append("user_id", this.props.login_data.user_id)
      formData.append("from_date", moment(this.state.selectedStartDate).format("YYYY-MM-DD"))
      formData.append("to_date", moment(this.state.selectedEndDate).format("YYYY-MM-DD"))
      fetch(list_url, {
        method: 'POST',
        body: formData
      })
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({spinner_visible:false})
        this.props.send_taskList(responseData)
        this.props.navigation.navigate("CustomDatePage")        
      })
      .catch(function(error) {
        return error;
      })
    }

  }

  click_mapPinIcon() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        if (this.state.saved_detailedData.latitude == null || this.state.saved_detailedData.longitude == null)  {
          Alert.alert("Location is not available")
        } else {
          var temp_map_location = {
            latitude: parseFloat(this.state.saved_detailedData.latitude),
            longitude: parseFloat(this.state.saved_detailedData.longitude),
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }
          var temp_pin_location = {
            latitude: parseFloat(this.state.saved_detailedData.latitude),
            longitude: parseFloat(this.state.saved_detailedData.longitude)
          }
          this.setState({region: temp_map_location})
          this.setState({markerRegion: temp_pin_location})

          this.setModalVisible_map(true)
        }
      } else {
        Alert.alert("You cannot use map on offline.")
      }
    })
  }

  clickCameraCaptureBtn() {
    this.props.send_editPhoto(null)
    this.props.navigation.navigate('CameraPage', {
      onNavigateBack: this.handleOnNavigateBack.bind(this)
    })
  }

  click_ClockInBtn() {
    NetInfo.isConnected.fetch().then(isConnected => {
      console.log('-------------------', this.props.claim_data.claim_list[this.props.claim_number])
      if (isConnected) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.setState({spinner_visible:true})
            this.setState({is_clockIn: true})
    
            var temp = this.state.duration;
            this._interval = setInterval( () => {
              temp += 1;
              this.setState({duration: temp})
            }, 1000)

            
            var duration_url = URLclass.url + 'checkInOut'

            var formData = new FormData();
            formData.append("user_id", this.props.login_data.user_id)
            formData.append("inspectioninfo_pk", this.props.claim_data.claim_list[this.props.claim_number].InspectionInfoId_PK)
            formData.append("action", "CLOCK_IN")
            formData.append("latitude", position.coords.latitude)
            formData.append("longitude", position.coords.longitude)
            fetch(duration_url, {
              method: 'POST',
              body: formData
            })
            .then((response) => response.json())
            .then((responseData) => {
              console.log('-------------- Response ----------------', responseData)
              console.log('---------------- Locaiton --------------',position.coords.latitude, position.coords.longitude)
              console.log('-------------- Response ----------------', this.props.login_data.user_id)
              this.setState({spinner_visible:false})
              
            })
            .catch(function(error) {
              return error;
            })

          },
          (error) => Alert.alert('To continu, turn on device location, which uses Google\'s location service.'),
          { enableHighAccuracy: false, timeout: 20000 },
        );
      } else {
        Alert.alert("You can't use this function in offline mode.")
      }
    })
  }

  click_ColciOutBtn() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        

        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.setState({spinner_visible:true})
            this.setState({is_clockIn: false})
            clearInterval(this._interval);

            var duration_url = URLclass.url + 'checkInOut'

            var formData = new FormData();
            formData.append("user_id", this.props.login_data.user_id)
            formData.append("inspectioninfo_pk", this.props.claim_data.claim_list[this.props.claim_number].InspectionInfoId_PK)
            formData.append("action", "CLOCK_OUT")
            formData.append("latitude", position.coords.latitude)
            formData.append("longitude", position.coords.longitude)
            fetch(duration_url, {
              method: 'POST',
              body: formData
            })
            .then((response) => response.json())
            .then((responseData) => {
              console.log('++++++++++++++++ Response ++++++++++++++++', responseData)
              console.log('---------------- Locaiton ++++++++++++++++',position.coords.latitude, position.coords.longitude)
              console.log('++++++++++++++++ Response ++++++++++++++++', this.props.login_data.user_id)

              this.setState({spinner_visible:false})
              
            })
            .catch(function(error) {
              return error;
            })
          },
          (error) => Alert.alert('GPS is off. Turn it on.'),
          { enableHighAccuracy: false, timeout: 20000 },
        );
      } else {
        Alert.alert("You can't use this function in offline mode.")
      }
    })
  }

  show_timeDuration() {
    var temp_minute = Math.floor(this.state.duration / 60) % 60
    var temp_second = this.state.duration % 60
    var temp_hour = Math.floor(this.state.duration /60 / 60)

    if (temp_hour <= 9) {
      hour = '0' + temp_hour.toString()
    } else {
      hour = temp_hour
    }

    if (temp_minute <= 9) {
      minute = '0' + temp_minute.toString()
    } else {
      minute = temp_minute
    }

    if (temp_second <= 9) {
      second = '0' + temp_second.toString()
    } else {
      second = temp_second
    }

    return (
      <Text style={{color:'#616161', fontSize:55, fontWeight:'400'}}>{hour}:{minute}:{second}
      </Text>
    )
  }

  show_timesheetPage() {
    return (
      <View>
        <View style={{backgroundColor:'#eceff1', height:deviceHeight/5, alignItems:'center'}}>
          <Text style={{color:'#717171', fontSize:20, fontWeight:'400', marginTop:deviceHeight/30}}>{this.state.timesheet_date}</Text>
          {this.show_timeDuration()}
        </View>
        <View style={{margin:deviceWidth/30}}>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            {this.state.is_clockIn == false ?
              <TouchableOpacity style={{backgroundColor:'#ff4083', width:deviceWidth/2.3, height:deviceHeight/15, alignItems:'center', justifyContent:'center'}} onPress={() => this.click_ClockInBtn()}>
                <Text style={{color: '#fff', fontSize: 15, fontWeight: '400'}}>CHECK IN</Text>
              </TouchableOpacity>
            : <View style={{backgroundColor:'#eceff1', width:deviceWidth/2.3, height:deviceHeight/15, alignItems:'center', justifyContent:'center'}}>
                <Text style={{color: '#818181', fontSize: 15, fontWeight: '400'}}>CHECK IN</Text>
              </View>
            }
            {this.state.is_clockIn == true ?
              <TouchableOpacity style={{backgroundColor:'#ff4083', width:deviceWidth/2.3, height:deviceHeight/15, alignItems:'center', justifyContent:'center'}} onPress={() => this.click_ColciOutBtn()}>
                <Text style={{color: '#fff', fontSize: 15, fontWeight: '400'}}>CHECK OUT</Text>
              </TouchableOpacity>
            : <View style={{backgroundColor:'#eceff1', width:deviceWidth/2.3, height:deviceHeight/15, alignItems:'center', justifyContent:'center'}}>
                <Text style={{color: '#818181', fontSize: 15, fontWeight: '400'}}>CHECK OUT</Text>
              </View>
            }
            
            
          </View>

          <TouchableOpacity style={{marginTop:deviceHeight/20}} onPress={() => this.click_todayBtn()}>
            <Text style={{color: 'black', fontSize: 15, fontWeight: '400', marginLeft:deviceWidth/50}}>Today</Text>
            <View style={{backgroundColor:'#acacac', height:1, marginTop:deviceHeight/100}} />
          </TouchableOpacity>
          <TouchableOpacity style={{marginTop:deviceHeight/40}} onPress={() => this.click_customDateBtn()}>
            <Text style={{color: 'black', fontSize: 15, fontWeight: '400', marginLeft:deviceWidth/50}}>Custom date</Text>
            <View style={{backgroundColor:'#acacac', height:1, marginTop:deviceHeight/100}} />
          </TouchableOpacity>
        </View>
        
      </View>
    )
  }

  show_basicInfo() {
    if (this.state.saved_detailedData != null) {
      return (
        <ScrollView style={{backgroundColor:'#fafafa'}}>
          <View style={{backgroundColor:'#fff', margin:deviceWidth/30, borderColor:'#e5e5e5', borderWidth:1, borderRadius:3}}>
            <Text style={{margin:deviceWidth/20, fontWeight:'400', fontSize:17}}>INSURED DETAILS</Text>
            <View style={{backgroundColor:'#657682', height:2, marginLeft:deviceWidth/50, marginRight:deviceWidth/50}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={person_icon} style={styles.personIconStyle} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Insured Name</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.insured_name}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={insured_icon} style={styles.insuredIconStyle} />
              </View>
              <View style={{flex:8.5}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Insured Address</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.insured_address}</Text>
              </View>
              <TouchableOpacity style={{flex:1.5}} onPress={() => this.click_mapPinIcon()}>
                <Image source={pin_icon} style={{width:deviceWidth/13, height:deviceWidth/13, marginRight:deviceWidth/50}} />
              </TouchableOpacity>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={phone_icon} style={styles.insuredIconStyle} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Insured Phone</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.insured_phone}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={claim_icon} style={{width:deviceWidth/20, height:deviceWidth*1.21/20}} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Claim Number</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.claim_number}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={policy_icon} style={{width:deviceWidth/20, height:deviceWidth*1.02/20}} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Policy Number</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.policy_number}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={calendar_icon} style={{width:deviceWidth/20, height:deviceWidth*0.95/20}} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Date of loss</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.date_of_loss}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={calendar_icon} style={{width:deviceWidth/20, height:deviceWidth*0.95/20}} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Date Assigned</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{moment(this.state.saved_detailedData.date_assigned).format("MM-DD-YYYY")}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={calendar_icon} style={{width:deviceWidth/20, height:deviceWidth*0.95/20}} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Loss Type</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.loss_type}</Text>
              </View>
            </View>
            <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/30, marginRight:deviceWidth/30}} />

            <View style={{flexDirection: 'row', alignItems:'center', margin:deviceWidth/50, marginLeft:deviceWidth/17, justifyContent:'space-between'}}>
              <View style={{flex:1}}>
                <Image source={calendar_icon} style={{width:deviceWidth/20, height:deviceWidth*0.95/20}} />
              </View>
              <View style={{flex:9}}>
                <Text style={{fontWeight:'400', fontSize:14, color:'#818181'}}>Remark</Text>
                <Text style={{fontWeight:'400', fontSize:15}}>{this.state.saved_detailedData.claim_remark}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )
    }
  }

  show_photos() {
    if (this.props.photo_array.lengh != 0) {
      var i=-1;
      return this.props.photo_array.map((data) => {
        i++;
        if (i % 2 == 0) {
          return (
            <View style={{width:deviceWidth/2}} key={i}>
              <Child_Photo itemData={data} index={i} deletePhoto={this.DoDeletePhoto} editPhoto={this.DoEditPhoto} clickPhoto={this.DoClickPhoto} status={this.props.claim_status} />
            </View>
          )
        } else {
          return (
            <View style={{width:deviceWidth/2, marginLeft:deviceWidth/2, marginTop:-deviceHeight/2.6-deviceWidth/50}} key={i}>
              <Child_Photo itemData={data} index={i} deletePhoto={this.DoDeletePhoto} editPhoto={this.DoEditPhoto} clickPhoto={this.DoClickPhoto} status={this.props.claim_status} />
            </View>
          )
        }
      })
    }
  }

  show_cameraIcon() {
    if (this.props.claim_status == "no") {
    } else {
      return (
        <TouchableOpacity style={{bottom:deviceHeight/50, right:deviceWidth/20, position: 'absolute'}} onPress={() => this.clickCameraCaptureBtn()}>
          <Image source={camera_icon} style={{width:deviceWidth/8, height:deviceWidth/8}} />
        </TouchableOpacity>
      )
    }
  }

  click_saveInspectionBtn() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.setState({spinner_visible:true})
        var save_url = URLclass.url + 'saveInspection'
        var formData = new FormData();
        formData.append("user_id", this.props.login_data.user_id)
        formData.append("insp_batchdetail_pk", this.props.claim_data.claim_list[this.props.claim_number].InspBatchDetailId_PK)
        formData.append("inspectioninfo_pk", this.props.claim_data.claim_list[this.props.claim_number].InspectionInfoId_PK)
        formData.append("description", this.state.quote_description)
        formData.append("inspection_last_status", this.state.status)
        formData.append("contract_insp_type_code", this.props.claim_data.claim_list[this.props.claim_number].ContractInspTypeCode)
        formData.append("insp_type_code", this.props.claim_data.claim_list[this.props.claim_number].Record_Type_Code)
        fetch(save_url, {
          method: 'POST',
          body: formData
        })
        .then((response) => response.json())
        .then((responseData) => {
          if (responseData.status == 1) {
            this.setState({spinner_visible:false})

            if (this.state.status == "CLOSE") {
              this.setState({is_saveButton_enable: false})
              this.props.send_claimStatus("no")
            }

            this.tabView.goToPage(0)
            {this.getFirstData()}
          } else {
            var self=this
            self.setState({spinner_visible:false})
            setTimeout(function(){
              Alert.alert("Please try later.")
              }, 300); 
            }
          })
        .catch(function(error) {
          return error;
        })
      } else {
        Alert.alert("Please save summary when online.")
      }
    })
  }

  show_summary() {
    return (
      <ScrollView style={{backgroundColor:'#fafafa'}}>
        <View style={{backgroundColor:'#fff', margin:deviceWidth/30, borderColor:'#e5e5e5', borderWidth:1, borderRadius:3}}>
          <Text style={{margin:deviceWidth/20, fontWeight:'400', fontSize:17}}>Inspection Summary</Text>
          <View style={{backgroundColor:'#657682', height:2, marginLeft:deviceWidth/50, marginRight:deviceWidth/50}} />
          {this.state.is_saveButton_enable == true ?
            <View style={{margin:deviceHeight/30, backgroundColor:'white', borderRadius:5, borderColor:'#acacac', borderWidth:1, height:deviceHeight/3.5}}>
              <Input multiline={true} numberOfLines={10} style={{paddingLeft:10, textAlignVertical: "top"}} 
                value={this.state.quote_description}
                placeholder='Findings/Recommendations' onChangeText={quote_description => this.setState({ quote_description })} />
            </View>
          : <View style={{margin:deviceHeight/30, backgroundColor:'white', borderRadius:5, borderColor:'#acacac', borderWidth:1, height:deviceHeight/3.5}}>
            </View>
          }
          <View style={{backgroundColor:'#d8dde5', height:1, marginLeft:deviceWidth/25, marginRight:deviceWidth/25, marginTop:deviceHeight/50}} />
          <Text style={{margin:deviceWidth/20, fontWeight:'400', fontSize:13, color:'#818181'}}>Inspection Status</Text>

          {this.state.is_saveButton_enable == true ?
            <View style={{borderWidth:1, borderColor:'#acacac', width:deviceWidth*16/20, height:deviceHeight/15, marginLeft:deviceWidth/20+deviceWidth/60}}>
              <Form style={{paddingLeft:deviceWidth/50, paddingRight:deviceWidth/50, marginTop:-5}}>
                <Picker
                  mode="dropdown"
                  placeholder="Select One"
                  selectedValue={this.state.status}
                  onValueChange={this.change_status.bind(this)}
                >
                  <Item label="CLOSE" value="CLOSE" />
                  <Item label="PENDING" value="PENDING" />
                </Picker>
              </Form>
            </View>
          : <View style={{borderWidth:1, borderColor:'#acacac', width:deviceWidth*16/20, height:deviceHeight/15, marginLeft:deviceWidth/20+deviceWidth/60, justifyContent:'center'}}>
              <Text style={{marginLeft:deviceWidth/30}}>CLOSE</Text>
            </View>
          }

          {this.state.is_saveButton_enable == true ?
            <TouchableOpacity style={{backgroundColor:'#ff4083', width:deviceWidth*16/20, height:deviceHeight/15, marginLeft:deviceWidth/20+deviceWidth/60, marginTop:deviceHeight/20, alignItems:'center', justifyContent:'center', marginBottom:deviceHeight/30}} onPress={() => this.click_saveInspectionBtn()}>
              <Text style={{color: '#fff', fontSize: 15, fontWeight: '400'}}>SAVE INSPECTION</Text>
            </TouchableOpacity>
          : <View style={{backgroundColor:'#818181', width:deviceWidth*16/20, height:deviceHeight/15, marginLeft:deviceWidth/20+deviceWidth/60, marginTop:deviceHeight/20, alignItems:'center', justifyContent:'center', marginBottom:deviceHeight/30}}>
              <Text style={{color: '#fff', fontSize: 15, fontWeight: '400'}}>SAVE INSPECTION</Text>
            </View>
          }
          
        </View>
      </ScrollView>
    )
  }

  changeTab(index) {
    if (index.i == "0") {
      this.setState({selectedTabNum: 0})
    } else if (index.i == "1") {
      this.setState({selectedTabNum: 1})

      AsyncStorage.getItem("saved_claimNumber").then((value) => {
        var temp1 = "is_photo_upload_later" + value.toString()
        AsyncStorage.getItem(temp1).then((value) => {
          if (value == 'yes') {
            this.setState({is_photo_later: true})
          } else {
            this.setState({is_photo_later: false})
          }
        }).done();

        var temp_temp = "saved_claim_count" + value.toString()
        AsyncStorage.getItem(temp_temp).then((count) => {
          var temp_index=0
          for (var i=1; i<=parseInt(count); i++) {
            var temp_userID;
            AsyncStorage.getItem("saved_userID").then((value) => {
              // this.setState({saved_userID: value})
              temp_userID = value
            }).done();

            var temp2 = "saved_insp_batchdetail_pk" + value.toString()
            var temp_batch;
            AsyncStorage.getItem(temp2).then((value) => {
              // this.setState({saved_insp_batchdetail_pk: value})
              temp_batch = value
            }).done();

            var temp3 = "saved_inspectioninfo_pk" + value.toString()
            var temp_insp;
            AsyncStorage.getItem(temp3).then((value) => {
              // this.setState({saved_inspectioninfo_pk: value})
              temp_insp = value
            }).done();

            var temp4 = "saved_tag_pk" + value.toString() + "_" + i.toString()
            var temp_tag;
            AsyncStorage.getItem(temp4).then((value) => {
              // this.setState({saved_tag_pk: value})
              temp_tag = value
            }).done();

            var temp5 = "saved_tag_group_pk" + value.toString() + "_" + i.toString()
            var temp_type
            AsyncStorage.getItem(temp5).then((value) => {
              // this.setState({saved_tag_group_pk: value})
              temp_type = value
            }).done();

            var temp6 = "saved_description" + value.toString() + "_" + i.toString()
            var temp_description
            AsyncStorage.getItem(temp6).then((value) => {
              // this.setState({saved_description: value})
              temp_description = value
            }).done();

            var temp7 = "saved_Filedata" + value.toString() + "_" + i.toString()
            var temp_file
            AsyncStorage.getItem(temp7).then((value) => {
              // this.state.saved_Filedata = JSON.parse(value)
              temp_file = JSON.parse(value)

              var temp_all = {userID: temp_userID, batchID: temp_batch, inspID: temp_insp, tagID: temp_tag, typeID: temp_type, descriptionID: temp_description, fileID: temp_file}
              var temp_array = this.state.saved_photos_list_for_upload
              temp_array.push(temp_all)
              this.setState({saved_photos_list_for_upload: temp_array})

              temp_index ++;
              if (temp_index == parseInt(count)) {
                {this.async_function()}  
              }
              
            }).done();

            
          }
        }).done()
      }).done();


    } else if (index.i == "2") {
      this.setState({selectedTabNum: 2})
    } else {
      this.setState({selectedTabNum: 3})
    }
  }


  async_function() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        if (this.state.is_photo_later == true) {
          Alert.alert(
            'Data async',
            'Please click OK for data async.',
            [
              {text: 'OK', onPress: this.clickOKBtn()},
            ],
            { cancelable: false }
          )
        }
      }
    })
  }

  clickOKBtn() {
    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        if (this.state.saved_photos_list_for_upload.length != 0) {
          var temp_temp_index=0
          for (var indexValue=0; indexValue<this.state.saved_photos_list_for_upload.length; indexValue++) {
            this.setState({spinner_visible:true})

            var temp_index = 0
            for (var i=0; i<this.state.saved_photos_list_for_upload[indexValue].fileID.length; i++) {
              
              var upload_url = URLclass.url + 'saveResizedImage'
              var formData = new FormData();
              formData.append("user_id", this.state.saved_photos_list_for_upload[indexValue].userID)
              formData.append("insp_batchdetail_pk", this.state.saved_photos_list_for_upload[indexValue].batchID)
              formData.append("inspectioninfo_pk", this.state.saved_photos_list_for_upload[indexValue].inspID)
              formData.append("tag_pk", this.state.saved_photos_list_for_upload[indexValue].tagID)
              formData.append("tag_group_pk", this.state.saved_photos_list_for_upload[indexValue].typeID)
              formData.append("description", this.state.saved_photos_list_for_upload[indexValue].descriptionID)
              formData.append("Filedata", {uri: this.state.saved_photos_list_for_upload[indexValue].fileID[i], name: 'selfie.jpg', type: 'image/jpg'})
              fetch(upload_url, {
                method: 'POST',
                body: formData
              })
              .then((response) => response.json())
              .then((responseData) => {
                temp_temp_index++;
                if (temp_temp_index == this.state.saved_photos_list_for_upload.length) {
                  AsyncStorage.getItem("saved_claimNumber").then((value) => {
                    var temp_key = "is_photo_upload_later" + value.toString()
                    var temp_aaa = 0
                    AsyncStorage.setItem(temp_key, "no");
                    var temp_temp = "saved_claim_count" + value.toString()
                    AsyncStorage.setItem(temp_temp, temp_aaa.toString());
                    var temp_list = this.state.saved_photos_list_for_upload
                    temp_list = []
                    this.setState({saved_photos_list_for_upload: temp_list})
                    this.setState({is_photo_later: false})
                    setTimeout(function () {
                      var self = this
                      self.setState({spinner_visible:false})

                      {this.getFirstData()}
                    }.bind(this), 10000);
                    

                    
                  }).done();
                }

                if (responseData.status == 0) {
                  var self=this
                  // self.setState({spinner_visible:false})
                  // var temp_key
                  // AsyncStorage.getItem("saved_claimNumber").then((value) => {
                  //   temp_key = "is_photo_upload_later" + value.toString()
                  //   AsyncStorage.setItem(temp_key, "no");
                  // }).done();
                } else {
                  temp_index ++;
                  if (temp_index == this.state.saved_Filedata.length) {
                    // var temp_key
                    // AsyncStorage.getItem("saved_claimNumber").then((value) => {
                    //   temp_key = "is_photo_upload_later" + value.toString()
                    //   AsyncStorage.setItem(temp_key, "no");
                    // }).done();
                    // this.setState({is_photo_later: false})
                    // this.setState({spinner_visible:false})
                    // {this.getFirstData()}
                  }
                }
              })
              .catch(function(error) {
                this.setState({spinner_visible:false})
                return error;
              })
            }


          }
        }
      }
    })    
  }


  showHeaderTitle() {
    if (this.state.selectedTabNum == 0) {
      return (
        <Title style={{color:'white'}}>Claim Check In</Title>
      )
    } else if (this.state.selectedTabNum == 1) {
      return (
        <Title style={{color:'white'}}>Basic Information</Title>
      )
    } else if (this.state.selectedTabNum == 2) {
      return (
        <Title style={{color:'white'}}>Photos</Title>
      )
    } else {
      return (
        <Title style={{color:'white'}}>Summary</Title>
      )
    }
  }


  render() {
    const { selectedStartDate, selectedEndDate } = this.state;
    const startDate  =  selectedStartDate ? selectedStartDate.toString() : '';
    const endDate = selectedEndDate ? selectedEndDate.toString() : '';

    return (
      <Container style={styles.container}>
        <Header style={{backgroundColor: '#224259'}}>
          <Left style={{ flex: 1,}}>
            <Button transparent onPress={() => this.props.navigation.goBack()}>
              <Icon name="ios-arrow-back" />
            </Button>
          </Left>

          <Body style={{ flex:3,  justifyContent: 'center', alignItems: 'center' }}>
            {this.showHeaderTitle()}
          </Body>

          <Right style={{ flex: 1,}} />
        </Header>

        <Tabs initialPage={0} onChangeTab={(i) => this.changeTab(i)} ref={(tabView) => {this.tabView = tabView}} tabBarPosition='overlayBottom' tabBarUnderlineStyle={{backgroundColor:'#224259'}} style={{backgroundColor:'#224259'}}>
          <Tab heading={ <TabHeading style={{backgroundColor:'#224259', width:deviceWidth/3, alignItems:'center'}}><Icon name="alarm" /><Text style={{fontSize:13}}>Timesheet</Text></TabHeading>}>
            {this.show_timesheetPage()}
          </Tab>
          <Tab heading={ <TabHeading style={{backgroundColor:'#224259', width:deviceWidth*2/9, alignItems:'center', marginLeft:deviceWidth/12}}><Icon name="home" /><Text style={{fontSize:13}}>Basic Info</Text></TabHeading>}>
            {this.show_basicInfo()}
          </Tab>
          <Tab heading={ <TabHeading style={{backgroundColor:'#224259', width:deviceWidth*2/9, alignItems:'center', marginLeft:deviceWidth/18}}><Icon name="photos" /><Text style={{fontSize:13}}>Photos</Text></TabHeading>}>
            <View style={{position: 'relative', width:deviceWidth, height:deviceHeight/1.3}}>
              <ScrollView style={{marginTop:deviceWidth/50}}>
                {this.show_photos()}
              </ScrollView>
              {this.show_cameraIcon()}
            </View>
          </Tab>
          <Tab heading={ <TabHeading style={{backgroundColor:'#224259', width:deviceWidth*2/9, alignItems:'center', marginLeft:deviceWidth/40}}><Icon name="chatboxes" /><Text style={{fontSize:13}}>Summary</Text></TabHeading>} tabStyle={{backgroundColor:'#fafafa'}} activeTabStyle={{backgroundColor:'#fafafa'}} activeTextStyle={{color:'#515151'}} textStyle={{color:'#818181'}}>
            {this.show_summary()}
          </Tab>
        </Tabs>

        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible_map}
          onRequestClose={() => this.setModalVisible_map(false)}
          >

          <View style={{width:deviceWidth, height:deviceHeight/10, backgroundColor:'#f3f3f3', justifyContent:'space-between', flexDirection:'row', alignItems:'center'}}>
            <Text style={{fontSize:18, fontWeight:'700', color:'#515151', marginLeft:deviceWidth/30}}>Map</Text>
            <TouchableOpacity style={{marginRight:deviceWidth/30}} onPress={() => this.setModalVisible_map(false)}>
                <Text style={{fontSize:15, fontWeight:'600', color:'#ff4083'}}>CANCEL</Text>
            </TouchableOpacity>
          </View>
          
          <MapView
            style={{width:deviceWidth, height:deviceHeight*8.6/10, backgroundColor:'#a3ccff'}}
            initialRegion={this.state.region}
          >
            <Marker
              coordinate={this.state.markerRegion}
              image={pin_icon}
            />
          </MapView>
        </Modal>

        <Modal
          animationType={"fade"}
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => this.setModalVisible(false)}
          >
          <View style={{width:deviceWidth, height:deviceHeight, backgroundColor:'rgba(0,0,0,0.7)', alignItems:'center'}}>
            <View style={{backgroundColor: '#FFF', marginTop: deviceHeight/15, width:deviceWidth/1.15, height:deviceHeight*8/10, borderWidth:1, borderColor:'#acacac', borderRadius:3}}>
              <View style={{marginTop:deviceHeight/30}}>
                <CalendarPicker
                  width = {deviceWidth/1.15}
                  startFromMonday={true}
                  allowRangeSelection={true}
                  todayBackgroundColor="#f2e6ff"
                  selectedDayColor="#ff4083"
                  selectedDayTextColor="#FFFFFF"
                  maxDate = {new Date()}
                  onDateChange={this.onDateChange}
                />
         
                <View style={{marginTop:deviceHeight/10, marginLeft:deviceWidth/20}}>
                  <Text style={{fontSize:15, fontWeight:'400', color:'#515151'}}>From Date :  { startDate }</Text>
                  <Text style={{fontSize:15, fontWeight:'400', color:'#515151'}}>To Date :  { endDate }</Text>
                </View>
              </View>

              <View style={{marginTop:deviceHeight/10, flexDirection:'row', justifyContent:'space-between', marginBottom:deviceHeight/30}}>
                <TouchableOpacity style={{marginLeft:deviceWidth/6}} onPress={() => this.setModalVisible(false)}>
                    <Text style={{fontSize:15, fontWeight:'600', color:'#ff4083'}}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{marginRight:deviceWidth/6}} onPress={() => this.click_OKBtn()}>
                    <Text style={{fontSize:15, fontWeight:'600', color:'#ff4083'}}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Spinner visible={this.state.spinner_visible} overlayColor='rgba(0,0,0,0.3)' />

      </Container>
    );
  }
}

function bindAction(dispatch) {
  return {
    send_photoArray: data => dispatch(send_photoArray(data)),
    send_deleted_photoArray: data => dispatch(send_deleted_photoArray(data)),
    send_editPhoto: data => dispatch(send_editPhoto(data)),
    send_typeList: data => dispatch(send_typeList(data)),
    send_tagList: data => dispatch(send_tagList(data)),
    send_claimStatus: data => dispatch(send_claimStatus(data)),
    send_clickPhoto: data => dispatch(send_clickPhoto(data)),
    send_date: data => dispatch(send_date(data)),
    send_taskList: data => dispatch(send_taskList(data))
  };
}

const mapStateToProps = state => ({
  claim_detail: state.user.claim_detail,
  login_data: state.user.login_data,
  claim_number: state.user.claim_number,
  claim_data: state.user.claim_data,
  photo_array: state.user.photo_array,
  claim_status: state.user.claim_status,
  tag_list: state.user.tag_list,
  type_list: state.user.type_list
});

export default connect(mapStateToProps, bindAction)(BlankPage);


class Child_Photo extends Component {
  constructor(props) {
      super(props);
      this.state = {
        visible: false,
        sub_description: ""
      };
  }

  componentWillMount() {
  }

  testFunction(i) {
    this.props.editPhoto(i)
    this.setModalVisible(false)
  }

  deleteFunction(i) {
    this.props.deletePhoto(i)
    this.setModalVisible(false)
  }

  clickImage(i) {
    this.props.clickPhoto(i)
  }

  setModalVisible(visible) {
    this.setState({visible: visible})
  }

  render() {
    return (
      <View style={{borderColor:'#acacac', borderWidth:1, width:deviceWidth*23/50, height:deviceHeight/2.6, marginLeft:deviceWidth/50, marginBottom:deviceWidth/50}}>
        <TouchableOpacity onPress={() => this.clickImage(this.props.index)}>
          <Image source={{uri: this.props.itemData.docurl}} style={{width:deviceWidth*23/50, height:deviceHeight/4}} />
        </TouchableOpacity>
        <Text style={{color:'#515151', fontSize:15, fontWeight:'500', margin:deviceWidth/100}}>{this.props.itemData.title}</Text>
        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
          {this.props.itemData.description.length > 40 ?
            <Text style={{color:'#818181', fontSize:12, fontWeight:'400', margin:deviceWidth/100, marginTop:-deviceWidth/200, flex:12}}>{this.props.itemData.description.substring(0, 40)} ...</Text>
          : <Text style={{color:'#818181', fontSize:12, fontWeight:'400', margin:deviceWidth/100, marginTop:-deviceWidth/200, flex:12}}>{this.props.itemData.description=="null" ? '' : this.props.itemData.description}</Text>
          }
          

          {this.props.status == "yes" ?
            <TouchableOpacity style={{flex:1}} onPress={() => this.setState({ visible: true })}>
              <Image source={more_icon} style={{width:deviceHeight*0.31/35, height:deviceHeight/35, marginRight:deviceWidth/50}} />
            </TouchableOpacity>
          : null}
          
        </View>
        
        <Modal
          animationType={"none"}
          transparent={true}
          visible={this.state.visible}
          onRequestClose={() => this.setModalVisible(false)}
          >
          <View style={{width:deviceWidth, height:deviceHeight, backgroundColor:'rgba(0,0,0,0.5)'}}>
            <View style={{width:deviceWidth/2, height:deviceHeight*3/17+1, marginLeft:deviceWidth/4, marginTop:deviceHeight/2.5, backgroundColor:'#fff', borderWidth:1, borderColor:'#224259', borderRadius:3}}>
              <TouchableOpacity style={{backgroundColor:'#224259', height:deviceHeight/17, justifyContent:'center'}} onPress={() => this.setModalVisible(false)}>
                <Image source={remove_icon} style={{width:deviceWidth/25, height:deviceWidth/25, marginLeft:deviceWidth/40}} />
              </TouchableOpacity>
              
              <TouchableOpacity style={{marginLeft:deviceWidth/10,  height:deviceHeight/17, justifyContent:'center'}} onPress={() => this.testFunction(this.props.index)}>
                <Text style={{fontSize:18, fontWeight:'400', color:'#515151'}}>Edit</Text>
              </TouchableOpacity>
              <View style={{backgroundColor:'#dcdcdc', height:1, marginRight:deviceWidth/100, marginLeft:deviceWidth/100}} />
              <TouchableOpacity style={{marginLeft:deviceWidth/10, height:deviceHeight/17, justifyContent:'center'}} onPress={() => this.deleteFunction(this.props.index)}>
                <Text style={{fontSize:18, fontWeight:'400', color:'#515151'}}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
          
        </Modal>
      </View>
    );
  }
}