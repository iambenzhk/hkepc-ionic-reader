/**
 * Created by Gaplo917 on 11/1/2016.
 */
//import * as cheerio from 'cheerio';
import * as HKEPC from "../../data/config/hkepc"
import * as URLUtils from "../../utils/url"
import {GeneralHtml} from "../model/general-html"
var cheerio = require('cheerio')
var async = require('async');

export class PostController{

  constructor($scope,$http, $stateParams,$sce,$state,$location,$message) {
    $scope.vm = this;
    this.scope = $scope
    this.http = $http
    this.messageService = $message
    this.state = $state
    this.location = $location
    this.sce = $sce

    this.topicId = $stateParams.topicId
    this.postId = $stateParams.postId
    this.page = $stateParams.page
    this.messages = []
    this.postUrl = URLUtils.buildUrlFromState($state,$stateParams)

    // to control the post is end
    this.end = false;

    // create a UI rendering queue
    this.q = async.queue((task, callback) => {

      // update the messages list
      const message = task()
      if(this.messages.filter((m) => m.id == message.id).length > 0){
        this.end = true
      }
      else{
        this.messages.push(message)
      }

      if(this.q.length() % 10 == 0){
        // force update the view after 10 task
        this.scope.$apply()
      }

      setTimeout(() => callback(), 20)
    }, 1);


    // add action

    $scope.$on('$ionicView.loaded', (e) => {
      this.loadMore()
    })

  }

  loadMore(cb){
    if(this.hasMoreData()){
      this.loadMessages(cb)
    }

  }

  hasMoreData(){
    return !this.end && !this.refreshing
  }

  loadMessages(cb){
    this.http
        .get(HKEPC.forum.posts(this.topicId,this.postId,this.page))
        .then((resp) => {

          async.waterfall([
            (callback) => {
              const html = new GeneralHtml(cheerio.load(resp.data))

              let $ = html
                  .removeIframe()
                  .processImgUrl(HKEPC.forum.image)
                  .getCheerio()

              // remove the hkepc forum text
              const postTitle = html
                  .getTitle()
                  .split('-')[0]

              // select the current login user
              const currentUsername = $('#umenu > cite').html()

              // the first post
              const firstPost = $('.postcontent > .defaultpost > .postmessage.firstpost > .t_msgfontfix')

              angular.extend(this,{
                post:{
                  title: postTitle
                },
                topic: {
                  id: this.topicId
                }
              })

              // callback for next function
              callback(null, $,postTitle);
            },
            ($,postTitle, callback) => {

              // PostHtml map to the model
              const tasks = $('#postlist > div').map( (i,elem) => {
                return () => {
                  console.log("lazy function!!!")
                  let postSource = cheerio.load($(elem).html())

                  const message = {
                    id: postSource('table').attr('id'),
                    pos: postSource('.postinfo strong a em').text(),
                    inAppUrl: this.postUrl,
                    createdAt: postSource('.posterinfo .authorinfo em').text(),
                    content : this.sce.trustAsHtml(
                        postSource('.postcontent > .defaultpost > .postmessage > .t_msgfontfix').html()
                    ),
                    post:{
                      id: this.postId,
                      topicId: this.topicId,
                      title: postTitle,
                      page: this.page
                    },
                    author:{
                      image: postSource('.postauthor .avatar img').attr('src'),
                      name : postSource('.postauthor > .postinfo').text()
                    }
                  }

                  message.likedStyle = this.messageService.isLikedPost(message)
                      ? {color: '#0c60ee'}
                      : {}

                  return message
                }

              }).get()

              this.q.push(tasks)

              this.q.drain = () => {
                this.scope.$broadcast('scroll.infiniteScrollComplete')
                console.log("Done All UI rendering")
                callback()
                if(cb) cb(null)
              }

            }
          ], (err, result) => {
            // result now equals 'done'
            console.log("ALL TASK DONE!!!",err)
          });

        }, (err) => {
          console.error('ERR', JSON.stringify(err))
        })

    //update the page count
    this.page = parseInt(this.page) + 1
  }

  like(message){
    console.log('like',message)

    if(this.messageService.isLikedPost(message)){
      this.messageService.remove(message)
      message.likedStyle = {}
    }
    else {
      this.messageService.add(message)
      message.likedStyle = {color: '#0c60ee'}
    }

  }

  reset(){
    this.messages = []
    this.q.kill()
    this.page = 1
  }

  doRefresh(){
    this.refreshing = true
    this.reset()
    this.loadMessages(() => {
      this.refreshing = false
      this.scope.$broadcast('scroll.refreshComplete');
    })
  }

}