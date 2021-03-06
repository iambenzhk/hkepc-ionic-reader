/**
 * Created by Gaplo917 on 31/1/2016.
 */

import * as HKEPC from '../data/config/hkepc'
import {Bridge, Channel} from './bridge/index'

/**
 * Register the directives
 */
export default angular.module('starter.directives', ['ngAnimate'])

  .directive('compile', ($compile) => {
    return (scope, element, attrs) => {
      scope.$watch(
        (scope) => {
          return scope.$eval(attrs.compile)
        },
        (value) => {
          element.html(value)
          $compile(element.contents())(scope)
        }
      )
    }
  })
  .directive('inputHelper', (Upload, $timeout) => {
    return {
      restrict: 'E',
      scope:    {
        modal:         '=',
        contentModel:  '='
      },
      link:     function (scope, element) {
        const modal = scope.modal

        scope.selectTab = (index) => {
          if (index === 4 && Bridge.isAvailable()) {
            Bridge.callHandler(Channel.uploadImage, modal.hiddenAttachFormInputs, (attachmentIds) => {

              modal.onImageUploadSuccess(attachmentIds)

              $timeout(() => {
                scope.$apply()
              })
            })
          }
          else {
            modal.showInputHelperAt = index
          }
        }
        scope.isTab = (index) => {
          return modal.showInputHelperAt === index
        }
        scope.isSelectedTab = () => {
          return modal.showInputHelperAt >= 0
        }

        scope.prepareUpload = function (file) {
          scope.imageErr = undefined
          scope.imageErrSuggestion = undefined
          scope.previewUploadImage = undefined

          if (file) {
            var reader = new FileReader()

            reader.onload = function (e) {
              const fileSizeInKB = e.total / 1000
              if (fileSizeInKB >= 150) {

                scope.imageErr = `圖片(${fileSizeInKB} KB) 大於 HKEPC 限制(150KB)`
                scope.imageErrSuggestion = `建議使用具有自動壓縮功能的 iOS 或 Android (6.0 或以上) HKEPC IR Pro App`
              } else {
                // image is valid to upload
                scope.file = file
              }

              scope.previewUploadImage = e.target.result
              scope.$apply()
            }

            reader.readAsDataURL(file)
          }

        }

        scope.upload = function () {
          console.log("modal.hiddenAttachFormInputs", modal.hiddenAttachFormInputs)
          if (!modal.hiddenAttachFormInputs) {
            throw new Error("Modal Missing hiddenAttachFormInputs")
          }

          const data = modal.hiddenAttachFormInputs
          data.Filedata = scope.file

          Upload.upload({
            url:  data.action,
            data: data
          }).then(function (resp) {
            console.log('Success uploaded. Response: ', resp.data)

            //DISCUZUPLOAD|0|1948831|1
            const attactmentId = resp.data.split('|')[2]

            modal.onImageUploadSuccess([attactmentId])

            scope.imageUploadSuccess = `上傳成功 ${attactmentId}！`

            // release the file
            scope.file = undefined

          }, function (resp) {
            console.log('Error status: ' + resp.status)
          }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total)
            console.log('progress: ' + progressPercentage + '%')
          })
        }

        scope.resetUpload = function () {
          scope.imageErr = undefined
          scope.imageErrSuggestion = undefined
          scope.previewUploadImage = undefined
          scope.file = undefined
          scope.imageUploadSuccess = undefined
        }

        modal.gifs = HKEPC.data.gifs

        modal.addUrlToText = function (url, urlText) {
          const selectorId = this.id
          const selectionStart = document.getElementById(selectorId).selectionStart
          const content = document.getElementById(selectorId).value
          const splits = [content.slice(0, selectionStart), content.slice(selectionStart)]

          if (urlText) {
            scope.contentModel = `${splits[0]}[url=${url}]${urlText}[/url]${splits[1]}`
          } else {
            scope.contentModel = `${splits[0]}[url=${url}][/url]${splits[1]}`
          }

          scope.url = undefined
          scope.urlText = undefined
          $timeout(() => {
            scope.$apply()
          })

        }

        modal.addTextStyleTagToText = function (tag) {
          const selectorId = this.id
          const selectionStart = document.getElementById(selectorId).selectionStart
          const content = document.getElementById(selectorId).value
          const splits = [content.slice(0, selectionStart), content.slice(selectionStart)]

          console.log(splits)
          const openTag = `[${tag}]`
          const closeTag = `[/${tag}]`
          if (tag == 'hr') {
            scope.contentModel = `${splits[0]}${openTag}${splits[1]}`
          } else {
            scope.contentModel = `${splits[0]}${openTag}${closeTag}${splits[1]}`
          }

          const nselectionStart = selectionStart + openTag.length

          $timeout(() => {
            scope.$apply(() => {
              const elem = document.getElementById(selectorId)
              elem.focus()
              $timeout(() => {
                elem.setSelectionRange(nselectionStart, nselectionStart)
              }, 200)
            })
          })

        }
        modal.addFontSizeTagToText = function (size) {
          const selectorId = this.id
          const selectionStart = document.getElementById(selectorId).selectionStart
          const content = document.getElementById(selectorId).value
          const splits = [content.slice(0, selectionStart), content.slice(selectionStart)]

          const openTag = `[size=${size}]`
          const closeTag = `[/size]`

          scope.contentModel = `${splits[0]}${openTag}${closeTag}${splits[1]}`

          const nselectionStart = selectionStart + openTag.length
          $timeout(() => {
            scope.$apply(() => {
              const elem = document.getElementById(selectorId)
              elem.focus()

              $timeout(() => {
                elem.setSelectionRange(nselectionStart, nselectionStart)
              }, 200)
            })
          })

        }

        modal.addGifCodeToText = function (code) {
          const selectorId = this.id
          const selectionStart = document.getElementById(selectorId).selectionStart
          const content = document.getElementById(selectorId).value
          const splits = [content.slice(0, selectionStart), content.slice(selectionStart)]

          scope.contentModel = `${splits[0]} ${code} ${splits[1]}`
        }

        modal.addImageUrlToText = function (imageUrl) {
          const selectorId = this.id
          const selectionStart = document.getElementById(selectorId).selectionStart
          const content = document.getElementById(selectorId).value
          const splits = [content.slice(0, selectionStart), content.slice(selectionStart)]

          scope.contentModel = `${splits[0]}[img]${imageUrl}[/img]${splits[1]}`
          scope.imageUrl = undefined

          $timeout(() => {
            scope.$apply()
          })
        }
      },

      templateUrl: 'templates/directives/input.helper.html'
    }
  })
  // Customize from https://gist.github.com/BobNisco/9885852
  .directive('onLongPress', ($timeout) => {
    return {
      restrict: 'A',
      link: function ($scope, $elm, $attrs) {
        $elm.bind('touchstart', function (evt) {
          $scope.startTouch = {
            x: evt.touches[0].clientX,
            y: evt.touches[0].clientY
          }

          // Locally scoped variable that will keep track of the long press
          $scope.longPress = true

          // We'll set a timeout for 600 ms for a long press
          $timeout(function () {
            if ($scope.longPress) {
              // If the touchend event hasn't fired,
              // apply the function given in on the element's on-long-press attribute
              $scope.$apply(function () {
                $scope.$eval($attrs.onLongPress)
              })

              $scope.triggeredLongPress = true
            }
          }, 1200)
        })
        $elm.bind('touchcancel', function(evt){
          $scope.triggeredLongPress = false
          // Prevent the onLongPress event from firing
          $scope.longPress = false
        })

        $elm.bind('touchmove', function(evt){
          const { clientX, clientY } = evt.touches[0]
          if(Math.abs($scope.startTouch.x - clientX) > 5 || Math.abs($scope.startTouch.y - clientY) > 5){
            $scope.triggeredLongPress = false
            // Prevent the onLongPress event from firing
            $scope.longPress = false
          }
        })

        $elm.bind('touchend', function (evt) {
          if (!$scope.triggeredLongPress) {
            // no long press is triggered, show try to trigger short press
            if ($attrs.onShortPress) {
              $scope.$apply(function () {
                $scope.$eval($attrs.onShortPress)
              })
            }

          }

          $scope.triggeredLongPress = false
          // Prevent the onLongPress event from firing
          $scope.longPress = false
          // If there is an on-touch-end function attached to this element, apply it
          if ($attrs.onTouchEnd) {
            $scope.$apply(function () {
              $scope.$eval($attrs.onTouchEnd)
            })
          }
        })
      }
    }
  })
  .directive('onLongerThanScreen', ($window, $document, $timeout) => {
    return {
      restrict: 'A',
      link: function ($scope, $elm, $attrs) {
        const screenHeight = $window.innerHeight
        $timeout(() => {
          const height = $elm[0].clientHeight
          if (height > screenHeight) {

            console.log(`onLongerThanScreen, elementHeight ${height} > ${screenHeight}`)

            $scope.$apply(function () {
              $scope.$eval($attrs.onLongerThanScreen)
            })
          }
        })
      }
    }
  })
  .directive('lazyScroll', ($rootScope, rx) => {
      return {
        restrict: 'A',
        link: function ($scope, $element) {

          $scope.$createObservableFunction("$onScroll")
            .throttle(300, rx.Scheduler.async)
            .doOnNext(() => console.debug("emit lazy scroll event"))
            .subscribe(() => {
              $scope.$broadcast('lazyScrollEvent')
            })
        }
      }
    })
  .directive('lastread', ($document, rx) => {
    return {
      restrict: 'A',
      scope: true,
      link: ($scope, $element, $attributes) => {
        $scope.$eventToObservable('lazyScrollEvent')
          .startWith(1)
          .observeOn(rx.Scheduler.async)
          .doOnNext(() => console.debug("[LAST_READ] rx lazy scroll event"))
          .filter(() => {
            const clientHeight = $document[0].documentElement.clientHeight
            const imageRect = $element[0].getBoundingClientRect()
            return (imageRect.top >= 0 && imageRect.top <= clientHeight / 2)
          })
          .subscribe(() => {
            $scope.$emit('lastread', {page: $attributes.page, id: $attributes.id})
          })
      }
    }

  })
  .directive('imageLazySrc', ($document, $timeout, $ionicScrollDelegate, $compile, rx)  => {
      return {
        restrict: 'A',
        scope: {
          imageLazySrc: "@"
        },
        link: function ($scope, $element, $attributes) {

          const subscription = $scope.$eventToObservable('lazyScrollEvent')
            .startWith(1)
            .observeOn(rx.Scheduler.async)
            .doOnNext(() => console.debug("[LAZY_IMAGE] rx lazy scroll event"))
            .filter(() => {
              const clientHeight = $document[0].documentElement.clientHeight
              const imageRect = $element[0].getBoundingClientRect()
              return (imageRect.top >= 0 && imageRect.top <= clientHeight)
            })
            .take(1)
            .safeApply($scope, () => {
              $element[0].src = $attributes.imageLazySrc // set src attribute on element (it will load image)
            })
            .subscribe(() => {
              subscription.dispose()
            })

          // wrap a container
          $element.wrap('<div class="lazy-loading-container"></div>')

          // bind listener
          $element.on("error", function (e) {
            $element.off("error")
            subscription.dispose()
          })

          // unbind event listeners if element was destroyed
          // it happens when you change view, etc
          $element.on('$destroy', function () {
            subscription.dispose()
          })
        }
      }
    })
  .directive('irSpinner', function () {
    return {
      restrict: 'E',
      template: `<div class="icon"></div>`

    }
  })
