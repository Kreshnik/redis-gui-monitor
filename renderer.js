"use strict";

const shell = require('shelljs');
const Vue = require('./node_modules/vue/dist/vue.min');
const papaParse = require('./node_modules/babyparse/babyparse');
const {dialog} = require('electron').remote;
const fs = require("fs");

let childProcess = null;
const vm = new Vue({
    el: "body",
    data: {
        logs: [],
        started: false
    },
    methods: {
        startMonitor: function () {

            childProcess = shell.exec('redis-cli monitor', {async: true});
            childProcess.stdout.on('data', function (data) {

                if (data.trim() === "OK") {
                    this.started = true;
                }
                else {
                    this.prepareLogEntry(data);
                }

            }.bind(this));
        },
        stopMonitor: function () {
            childProcess.kill();
            this.started = false;
        },
        prepareLogEntry: function (data) {
            var regEx = /(^\d*\.?\d*) \[(.*?)\] (.*?(\"*.\")) (.*)/g;
            var matches = regEx.exec(data);
            var networkData = matches[2].split(' ');

            var ip = networkData[1].split(":")[0];
            var port = networkData[1].split(":")[1];

            var log = {
                time: matches[1],
                dbIndex: networkData[0],
                ip: ip,
                port: port,
                command: matches[3],
                data: matches[5]
            };
            this.logs.push(log);
        },
        export: function () {
            let csv = papaParse.unparse(this.logs);
            let timestamp = Date.now();
            dialog.showSaveDialog({
                title: 'Save CSV',
                defaultPath: `~/${timestamp}-redis-log.csv`,
                filters: [{name: 'CSV File', extensions: ['csv']}]
            }, function (fileName) {
                if (fileName === undefined) return;
                fs.writeFile(fileName, csv, function (err) {
                });
            });
        },
        clearLogView: function () {
            this.logs = [];
        }
    }
});