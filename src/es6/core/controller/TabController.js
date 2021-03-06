/**
 * Created by Gaplo917 on 23/1/2016.
 */
import * as HKEPC from '../../data/config/hkepc'
import {
  FindMessageRequest,
  NotificationBadgeUpdateRequest,
  CommonInfoExtractRequest,
  LoginTabUpdateRequest,
  PushHistoryRequest,
  ChangeThemeRequest,
  ChangeFontSizeRequest,
  HideUsernameRequest, MHeadFixRequest,
} from '../model/requests'

import {
  NativeChangeFontSizeRequest,
  NativeChangeThemeRequest,
  NativeHideUsernameRequest
} from '../bridge/requests'

import {
  Bridge,
  Channel,
  isiOSNative,
  isAndroidNative,
  isLegacyAndroid,
} from '../bridge/index'

import * as Controllers from './index'

export class TabController{
  static get STATE() { return 'tab'}
  static get NAME() { return 'TabController'}
  static get CONFIG() { return {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabController',
    controllerAs: 'vm'

  }}

  constructor($scope,$state,$rootScope,$ionicModal,$stateParams,AuthService,ngToast,LocalStorageService,HistoryService,$ionicHistory,rx, apiService, observeOnScope, $ionicSideMenuDelegate, $timeout) {
    console.debug(`[${TabController.NAME}] init`)

    this.scope = $scope
    this.rootScope = $rootScope
    this.localStorageService = LocalStorageService
    this.rx = rx
    this.state = $state
    this.authService = AuthService
    this.historyService = HistoryService
    this.ionicHistory = $ionicHistory
    this.apiService = apiService
    this.darkTheme = null
    this.isLoggedIn = false

    observeOnScope($scope, 'vm.fontSize').skip(1).subscribe(({oldValue, newValue}) => {
      const width = this.fontSize <= 100 ? 'device-width' : window.innerWidth * 100 / this.fontSize
      const viewport = document.querySelector("meta[name=viewport]")
      viewport.setAttribute('content', `initial-scale=${this.fontSize/100}, maximum-scale=${this.fontSize/100}, user-scalable=no, width=${width}`)

    })

    observeOnScope($scope, 'vm.darkTheme').subscribe(({oldValue, newValue}) => {
      if(isLegacyAndroid()){
        $rootScope.darkTheme(newValue)
      }
    })

    observeOnScope($scope, 'vm.notification').subscribe(({oldValue, newValue}) => {
      if(isLegacyAndroid()){
        $rootScope.notification(JSON.stringify(newValue))
      }
    })

    observeOnScope($scope, 'vm.login').subscribe(({oldValue, newValue}) => {
      if(isLegacyAndroid()){
        $rootScope.username(newValue)
      }
    })

    // cache the value
    rx.Observable.combineLatest(AuthService.isLoggedIn(), AuthService.getUsername(), (isLoggedIn, username) => {
      this.isLoggedIn = isLoggedIn

      this.scope.$emit(LoginTabUpdateRequest.NAME,new LoginTabUpdateRequest(username))
    }).subscribe()

    this.localStorageService.get('theme').safeApply(this.scope, data => {
      this.darkTheme = data
    }).subscribe()

    this.localStorageService.get('fontSize').safeApply(this.scope, data => {
      this.fontSize = data || "100"
    }).subscribe()

    this.localStorageService.get('hideUsername').safeApply(this.scope, data => {
      this.hideUsername = String(data) == "true"
    }).subscribe()

    this.localStorageService.get('mHeadFix').safeApply($scope, data => {
      if(data) {
        this.mHeadFix = String(data) === 'true'
      }
    }).subscribe()

    $scope.$on('$ionicView.loaded', (e) => {
      // FIXME: ugly hack for dark theme, all style use ios style
      this.removeAndroidStyleCssClass()

      $timeout(() => {
        // set after render
        $rootScope.isRendered = true
      })
    })

    $rootScope.$eventToObservable(CommonInfoExtractRequest.NAME)
      .filter(([event, req]) => req instanceof CommonInfoExtractRequest)
      .debounce(500)
      .subscribe( ([event, req]) =>{
        console.debug(`[${TabController.NAME}] Received CommonInfoExtractRequest`)

        // select the current login user
        const username = req.username

        const pmNotification = req.pmNotification

        const postNotification = req.postNotification

        this.localStorageService.set('formhash',req.formhash)

        // send the login name to parent controller
        this.scope.$emit(LoginTabUpdateRequest.NAME,new LoginTabUpdateRequest(username))

        // send the notification badge update in rootscope
        this.rootScope.$emit(NotificationBadgeUpdateRequest.NAME,new NotificationBadgeUpdateRequest(pmNotification,postNotification))

      })

    $rootScope.$eventToObservable(NotificationBadgeUpdateRequest.NAME)
      .filter(([event, req]) => req instanceof NotificationBadgeUpdateRequest)
      .debounce(500)
      .subscribe( ([event, req]) => {
        console.debug(`[${TabController.NAME}] Received NotificationBadgeUpdateRequest`)

        console.log(req.notification)
        const notification = req.notification

        this.notification = notification

        this.localStorageService.setObject('notification',notification)
      })

    $scope.$eventToObservable(LoginTabUpdateRequest.NAME)
      .filter(([event,req]) => req instanceof LoginTabUpdateRequest)
      .safeApply($scope, ([event,req]) => {
        console.debug(`[${TabController.NAME}] Received LoginTabUpdateRequest`,req)

        if(req.username != undefined && req.username != "") {

          this.isLoggedIn = true

          this.login = "IR 用家"

        } else {
          this.login = undefined

          if(this.isLoggedIn && !req.isFromLogout){
            ngToast.danger(`<i class="ion-alert-circled"> 你的登入認証己過期，請重新登入！</i>`)
            AuthService.logout()

            this.isLoggedIn = false
          }

        }

        // useful for Native App handling
        this.localStorageService.set('tabLoginName', this.login)
      }).subscribe()

    $scope.$eventToObservable(FindMessageRequest.NAME)
      .filter(([event,req]) => req instanceof FindMessageRequest)
      .safeApply(this.scope, ([event, req]) => {
        console.debug(`[${TabController.NAME}] Received FindMessageRequest`)

        this.state.go(Controllers.FindMessageController.STATE, {
          postId: req.postId,
          messageId: req.messageId
        })
      })
      .subscribe()

    $scope.$eventToObservable(PushHistoryRequest.NAME)
      .filter(([event,req]) => req instanceof PushHistoryRequest)
      .subscribe( ([event, req]) => {
        console.debug(`[${TabController.NAME}] Received PushHistoryRequest`)

        this.historyService.add(req.historyObj)

      })

    $scope.$eventToObservable(HideUsernameRequest.NAME)
      .filter(([event,req]) => req instanceof HideUsernameRequest)
      .flatMap(([event,req]) => {

        return this.authService.getUsername().map(username => {
          return {
            req: req,
            username: username
          }
        })
      })
      .safeApply($scope, ({req, username}) => {
        console.debug(`[${TabController.NAME}] Received HideUsernameRequest`, req)

        this.localStorageService.set('hideUsername',req.hidden)

        this.hideUsername = String(req.hidden) == "true"

        if (this.hideUsername) {
          // hide user name
          $scope.$emit(LoginTabUpdateRequest.NAME, new LoginTabUpdateRequest("IR 用家"))
        }
        else {
          // show user name
          $scope.$emit(LoginTabUpdateRequest.NAME, new LoginTabUpdateRequest(username))
        }
      }).subscribe()

    $rootScope.$eventToObservable(NativeChangeThemeRequest.NAME)
      .filter(([event,req]) => req instanceof NativeChangeThemeRequest)
      .safeApply(this.scope, ([event, req]) => {
        this.darkTheme = req.theme
      }).subscribe()

    $rootScope.$eventToObservable(NativeChangeFontSizeRequest.NAME)
      .filter(([event,req]) => req instanceof NativeChangeFontSizeRequest)
      .safeApply(this.scope, ([event, req]) => {
        this.fontSize = req.size
        this.ionicHistory.clearCache()
      }).subscribe()

    $rootScope.$eventToObservable(NativeHideUsernameRequest.NAME)
      .filter(([event,req]) => req instanceof NativeHideUsernameRequest)
      .safeApply(this.scope, ([event, req]) => {
        this.hideUsername = req.hideUsername
      }).subscribe()
    $scope.$eventToObservable(ChangeThemeRequest.NAME)

      .filter(([event,req]) => req instanceof ChangeThemeRequest)
      .safeApply(this.scope, ([event, req]) => {
        console.debug(`[${TabController.NAME}] Received ChangeThemeRequest`)
        this.darkTheme = req.theme
        this.localStorageService.set('theme',req.theme)
      }).subscribe()

    $scope.$eventToObservable(ChangeFontSizeRequest.NAME)
      .filter(([event,req]) => req instanceof ChangeFontSizeRequest)
      .safeApply(this.scope, ([event, req]) => {
        console.debug(`[${TabController.NAME}] Received ChangeFontSizeRequest`)
        this.fontSize = req.size
        this.localStorageService.set('fontSize',req.size)
        this.ionicHistory.clearCache();
      }).subscribe()

    $scope.$eventToObservable(MHeadFixRequest.NAME)
      .filter(([event,req]) => req instanceof MHeadFixRequest)
      .safeApply(this.scope, ([event, req]) => {
        console.debug(`[${TabController.NAME}] Received MHeadFixRequest`, req)
        this.mHeadFix = String(req.mHeadFix) === 'true'
        this.localStorageService.set('mHeadFix', req.mHeadFix ? 'true' : 'false')
      }).subscribe()
  }

  removeAndroidStyleCssClass(){
    const body = angular.element(document.querySelector('body'))[0]

    body.className = body.className.replace('platform-android','')
  }

}