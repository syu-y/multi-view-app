import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig } from 'axios';
import { parse } from 'node-html-parser';
import * as ApiConst from './api.const';

// ホロライブ公式から情報を取得
const getHoloiveInfo = async () => {
  const config: AxiosRequestConfig = {
    responseType: 'document',
  };

  // 公式サイトのメンバーページにアクセス
  const response = await axios.get(
    ApiConst.OFFICIAL_MEMBER_PAGE_HOLOLIVE,
    config
  );

  // stringからdocumentへの変換
  const document = parse(response.data);

  // メンバーの要素を取得
  const memberNodeList = document.querySelectorAll('.talent_list > li');

  // メンバーのページのURLの配列を取得
  const memberPageUrlList = memberNodeList.map((memberNode) => {
    const memberNodeAtag = memberNode.querySelector('a');
    return memberNodeAtag.getAttribute('href');
  });

  // 各メンバーのページにアクセスし、情報を取得
  const memberInfoList = memberPageUrlList.map(async (url) => {
    // メンバー個別ページにアクセス
    if (url) {
      const response = await axios.get(url, config);

      // stringからdocumentへの変換
      const document = parse(response.data);

      // 名前の取得
      const talentTop = document.querySelector('.talent_top');
      const nameArea = document.querySelector(
        '.container > .right_box > div > h1'
      );
      // 名前（英語）の取得
      const nameEnArea = nameArea.querySelector('span');
      const nameEn = nameEnArea.textContent;

      // 名前（日本語）の取得
      nameEnArea.remove();
      const nameJp = nameArea.textContent.replace(/\r?\n/g, '');

      // URL（Youtube/Twitter）の取得
      const snsNodeList = document.querySelectorAll(
        '.container > .right_box > div > ul > li'
      );

      let youtubeUrl = snsNodeList[0].querySelector('a').getAttribute('href');

      const channelId = youtubeUrl
        ?.replace(ApiConst.YOUTUBE_CHANNEL_BASE_URL[0], '')
        .replace(ApiConst.YOUTUBE_CHANNEL_BASE_URL[1], '')
        .replace(/[\/\?]{1}[a-zA-Z0-9_=\?].+/g, '');
      const twitterUrl = snsNodeList[1].querySelector('a').getAttribute('href');
      const twitterId = twitterUrl?.replace(ApiConst.TWITTER_BASE_URL, '');

      const memberInfo = {
        nameJp: nameJp,
        nameEn: nameEn,
        channelId: channelId,
        twitterId: twitterId,
        affiliation: ApiConst.TAG['hololive'],
      };

      return memberInfo;
    }
  });
  Promise.all(memberInfoList).then(() => {
    return memberInfoList;
  });
};

// にじさんじ公式ストアから情報を取得
const getNijisanjiInfo = async () => {
  const config: AxiosRequestConfig = {
    responseType: 'document',
  };

  //
  let allMemberPageUrlList: string[] = [];
  let existNextPage = true;
  let url = ApiConst.OFFICIAL_STORE_PAGE_NIJISANJI;
  while (existNextPage) {
    // 公式サイトのメンバーページにアクセス
    const response = await axios.get(url, config);

    // stringからdocumentへの変換
    const document = parse(response.data);

    // メンバーの要素を取得
    const memberNodeList = document.querySelectorAll('#first-area > div');

    // メンバーのページのURLの配列を取得
    const memberPageUrlList = memberNodeList.map((memberNode) => {
      const memberNodeAtag = memberNode.querySelector('a');
      return memberNodeAtag.getAttribute('href');
    });

    memberPageUrlList.map((url) => {
      if (url !== undefined) allMemberPageUrlList.push(url);
    });

    // 次のページの有無チェック
    const pageaArea = document.querySelector('.top-content > .pager-area');
    existNextPage =
      pageaArea.querySelector('.pager-right-arrow.grey-arrow') === null;
    if (existNextPage) {
      const nextPageUrl = pageaArea
        .querySelectorAll('a')
        .slice(-1)[0]
        .getAttribute('href');
      url = ApiConst.OFFICIAL_STORE_BASE_URL_NIJISANJI + nextPageUrl;
    }
  }
  console.log(allMemberPageUrlList.length);
};

// eslint-disable-next-line import/no-anonymous-default-export
export default (req: NextApiRequest, res: NextApiResponse) => {
  // getHoloiveInfo();
  getNijisanjiInfo();
  res.status(200).json({ name: 'John Doe' });
};
