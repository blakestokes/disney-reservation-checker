import Twilio from 'twilio';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

var availableRodeoTimes = [];
var availableCrystalPalaceTimes = [];

var textedRodeo = false;
var textedCrystalPalace = false;

const run = async() => {
    while(availableRodeoTimes.length == 0 || availableCrystalPalaceTimes.length == 0) {
        console.log('Searching - ' + getCurrentDateTime());

        if (availableRodeoTimes.length == 0) {
            await requestRodeoAvailabilities();      
        }

        if (availableCrystalPalaceTimes.length == 0) {
            await requestCrystalPalaceAvailabilities();      
        }

        if (availableRodeoTimes.length > 0 && !textedRodeo) {
            await sendNotifications(availableRodeoTimes, 'Roundup Rodeo');
            textedRodeo = true;
        }

        if (availableCrystalPalaceTimes.length > 0 && !textedCrystalPalace) {
            await sendNotifications(availableCrystalPalaceTimes, 'Crystal Palace');
            textedCrystalPalace = true;
        }

        console.log('Sleeping');
        await sleep(20);
        console.log('Awake');
    }
}

const requestCrystalPalaceAvailabilities = async() => {    
    const url = 'https://disneyworld.disney.go.com/finder/api/v1/explorer-service/dining-availability-list/false/wdw/80007798;entityType=destination/2023-05-10/2/?mealPeriod=80000712';
    await axios.get(url)
        .then(response => {
            let crystal_palace = response.data.availability['90002660;entityType=restaurant'];

            if (crystal_palace.hasAvailability) {
                console.log('Crystal Palace Reservation Available!');
                for(var i = 0; i < crystal_palace.singleLocation.offers.length; i++) {
                    var time = crystal_palace.singleLocation.offers[i].label;
                    if (!availableCrystalPalaceTimes.includes(time)) {
                        availableCrystalPalaceTimes.push(time);
                    }
                }
            }
            else {
                console.log('Crystal Palace not available');
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
}

const requestRodeoAvailabilities = async () => {
    const url = 'https://disneyworld.disney.go.com/finder/api/v1/explorer-service/dining-availability-list/false/wdw/80007798;entityType=destination/2023-05-10/2/?mealPeriod=80000714';
    await axios.get(url)
        .then(response => {
            let rodeo_roundup = response.data.availability['19553134;entityType=restaurant'];

            if (rodeo_roundup.hasAvailability) {
                console.log('Rodeo Reservation Available!');
                for(var i = 0; i < rodeo_roundup.singleLocation.offers.length; i++) {
                    var time = rodeo_roundup.singleLocation.offers[i].label;
                    if (!availableRodeoTimes.includes(time)) {
                        availableRodeoTimes.push(time);
                    }
                }
            }
            else {
                console.log('Rodeo Roundup not available');
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
}

const sendNotifications = async(times, restaurant) => {
    var accountSid = process.env.TWILIO_SID;
    var token = process.env.TWILIO_TOKEN;

    var timesString = '';

    for (var i in times) {
        if (i == times.length - 1) {
            timesString += ', and ';
        }
        else {
            timesString += ', '
        }
        timesString += times[i];
    }

    var twilio = new Twilio(accountSid, token);
    var message = timesString + ' reservation(s) available at ' + restaurant + '! - from Blake';
    var numbers = [
        // process.env.CHASE_PHONE, 
        // process.env.SYD_PHONE, 
        process.env.BLAKE_PHONE
    ];

    for(var i in numbers) {
        twilio.messages.create({
            from: process.env.TWILIO_NUMBER,
            to: numbers[i],
            body: message,
        }).then(message => console.log(message));
    }
}

const getCurrentDateTime = () => {
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = (today.getHours() >= 13 ? today.getHours() - 12 : today.getHours()) + ":" + today.getMinutes() + ":" + today.getSeconds() + (today.getHours() >= 12 ? ' PM' : ' AM');
    return date+' '+time;
}

const sleep = async (sec) => {
    return new Promise((resolve) => {
      setTimeout(resolve, sec * 1000);
    });
  }

run();