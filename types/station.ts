export type Battery = {
    battery_id: string;
    slot_id: string;
    battery_capacity: string;
    lock_status: string;
    battery_abnormal: string;
    cable_abnormal: string;
    contact_abnormal: string;
  };
  
  import { GeoPoint, Timestamp } from 'firebase/firestore'; // Assuming you're using Firestore for GeoPoint type

export type Station = {
  stationTitle: string;
  stationSubTitle:string;

  slots: number;
  address:string;
  createDate:Timestamp;
  email:string;
  facebook:string;
  frEnd:string;
  frStart:string;
  images:[string];
  instagram:string;
  logo:string;
  moEnd:string;
  moStart:string;
  note:string;
  parking:number;
  powerBank:number;
  price:number;
  saEnd:string;
  saStart:string;
  stationId:string;
  suEnd:string;
  suStart:string;
  tel:string;
  thEnd:string;
  thStart:string;
  tiktok:string;
  tuEnd:string;
  tuStart:string;
  twitter:string;
  weEnd:string;
  weStart:string;
  website:string;
  location: GeoPoint;
  id: string;
  imei: string;
  iccid: string;
  slot_num: string;
  batteries: Battery[];
  status: boolean;
};
