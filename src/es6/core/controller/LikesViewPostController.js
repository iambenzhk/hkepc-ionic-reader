/**
 * Created by Gaplo917 on 11/1/2016.
 */
//import * as cheerio from 'cheerio';
import * as HKEPC from '../../data/config/hkepc'
import * as URLUtils from '../../utils/url'
import {HKEPCHtml} from "../model/hkepc-html"
import {FindMessageRequest} from "../model/FindMessageRequest"
import {CommonInfoExtractRequest} from "../model/CommonInfoExtractRequest"
import {PostDetailController} from "./PostDetailController"

import * as Controllers from "./index"

/**
 *  Just a Clone Controller for display in features tab
 */
export class LikesViewPostController extends PostDetailController {
  static get STATE() { return 'tab.likes-view-post'}
  static get NAME() { return 'LikesViewPostController'}
  static get CONFIG() { return {
    url: '/likes/topics/:topicId/posts/:postId/page/:page?delayRender=&focus=',
    views: {
      'tab-likes': {
        templateUrl: 'templates/post-detail.html',
        controller: LikesViewPostController.NAME,
        controllerAs: 'vm'
      }
    }
  }}

  constructor($scope, $stateParams,$sce,$state,$location,MessageService,$ionicHistory,$ionicModal,$ionicPopover,ngToast,AuthService,$ionicScrollDelegate,LocalStorageService,$ionicActionSheet,apiService,rx,$timeout) {
    super($scope, $stateParams,$sce,$state,$location,MessageService,$ionicHistory,$ionicModal,$ionicPopover,ngToast,AuthService,$ionicScrollDelegate,LocalStorageService,$ionicActionSheet,apiService,rx,$timeout)
  }


  onBack(){
    const history = this.ionicHistory.viewHistory()
    if(history.backView && history.backView.stateParams && history.backView.stateParams.postId != history.currentView.stateParams.postId){
      this.ionicHistory.goBack()
    } else {
      this.state.go(Controllers.LikesController.STATE)
    }
  }


}