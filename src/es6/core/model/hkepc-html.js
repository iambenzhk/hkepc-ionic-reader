/**
 * Created by Gaplo917 on 30/1/2016.
 */
import {GeneralHtml} from './general-html'
import * as HKEPC from '../../data/config/hkepc'
import * as URLUtils from '../../utils/url'
import * as Controllers from '../controller/index'
const cheerio = require('cheerio')

export class HKEPCHtml extends GeneralHtml{

  constructor(cheerioSource) {
    super(cheerioSource);
  }

  processEpcUrl(){

    this.source('a').each((i,e) => {

      // remove action attr on img
      this.source(e).removeAttr('onload')
      this.source(e).removeAttr('onclick')

      const url = this.source(e).attr('href')

      if(url && url.indexOf('redirect.php?') >= 0 && url.indexOf('goto=findpost') >= 0){
        const messageId = URLUtils.getQueryVariable(url,'pid')
        const postId = URLUtils.getQueryVariable(url,'ptid')

        this.source(e).attr('href',``)
        this.source(e).removeAttr('target')
        this.source(e).attr('ng-click',`vm.findMessage(${postId},${messageId})`)

      }
      else if(url && url.indexOf('viewthread.php?') >= 0){
        const postId = URLUtils.getQueryVariable(url,'tid')

        // detect the tab
        if(window.location.hash.indexOf(Controllers.FeatureRouteController.CONFIG.url) > 0){
          this.source(e).attr('href',`#/tab/features//posts/${postId}/page/1`)
        } else {
          this.source(e).attr('href',`#/tab/topics//posts/${postId}/page/1`)
        }

        this.source(e).removeAttr('target')
      }
      else if(url && url.indexOf('space.php?from=notice') >= 0){
        const urlText = this.source(e).text()
        const spanText = cheerio(`<span class="username">${urlText}</span>`)
        this.source(e).replaceWith(spanText)
      }
      else if(url && url.indexOf('logging.php') >= 0){
        this.source(e).attr('href',`#/tab/features/account`)

        this.source(e).removeAttr('target')
      }
      else if(url && url.indexOf('attachment.php?') >= 0){
        // remove action attr on img
        this.source(e).removeAttr('onload')
        this.source(e).removeAttr('onclick')

        this.source(e).attr('href','')
        this.source(e).attr('target',`_system`)
        this.source(e).attr('onclick',`window.open('${HKEPC.imageUrl}/${url}', '_system', 'location=yes'); return false;`)
      }

      // TODO: more rules needs to be applied here

    })

    return this
  }
}