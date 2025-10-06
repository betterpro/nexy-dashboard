export type Battery = {
  battery_id: string;
  slot_id: string;
  battery_capacity: string;
  lock_status: string;
  battery_abnormal: string;
  cable_abnormal: string;
  contact_abnormal: string;
};

import { GeoPoint, Timestamp } from "firebase/firestore"; // Assuming you're using Firestore for GeoPoint type

export type Station = {
  stationTitle: string;
  stationSubTitle: string;

  slots: number;
  address: string;
  createDate: Timestamp;
  email: string;
  facebook: string;
  frEnd: string;
  frStart: string;
  images: [string];
  instagram: string;
  logo: string;
  moEnd: string;
  moStart: string;
  note: string;
  parking: number;
  powerBank: number;
  price: number;
  saEnd: string;
  saStart: string;
  stationId: string;
  suEnd: string;
  suStart: string;
  tel: string;
  thEnd: string;
  thStart: string;
  tiktok: string;
  tuEnd: string;
  tuStart: string;
  twitter: string;
  weEnd: string;
  weStart: string;
  website: string;
  location: GeoPoint;
  id: string;
  imei: string;
  iccid: string;
  slot_num: string;
  batteries: Battery[];
  status: boolean;
};

// New Station type for the Stations collection
export type NewStation = {
  batteryCount: number;
  clientAddr: string;
  currency: string;
  franchiseeId: string;
  id: string;
  inventory: any | null;
  lastConnected: Timestamp;
  lastDisconnected: Timestamp;
  lastHeartbeat: Timestamp;
  lastUpdated: Timestamp;
  layout_json: {
    bottom: {
      height: number;
      assets: {
        duration: number;
        link: string;
        type: string;
      }[];
    };
    top: {
      height: number;
      assets: {
        duration: number;
        link: string;
        type: string;
      }[];
    };
    layout_size: {
      height: number;
      width: number;
    };
  };
  logo: string;
  mac: string;
  name: string;
  price: number;
  qrcode: {
    baseurl: string;
    generate: boolean;
    height: number;
    width: number;
    x: number;
    y: number;
  };
  release_dialog: {
    backgroundColor: string;
    duration: number;
    icon: string;
    subtitle: string;
    subtitleObj: {
      sizeSp: number;
    };
    title: string;
    titleObj: {
      bold: boolean;
      sizeSp: number;
    };
  };
  return_dialog: {
    backgroundColor: string;
    backgroundImage: string;
    duration: number;
    gravity: string;
    icon: {
      sizeDp: number;
      url: string;
      visible: boolean;
      paddingDp: number;
    };
    subtitle: string;
    subtitleObj: {
      color: string;
      sizeSp: number;
    };
    title: string;
    titleObj: {
      bold: boolean;
      color: string;
      sizeSp: number;
    };
  };
  role: string;
  stationId: string;
  status: string;
};
