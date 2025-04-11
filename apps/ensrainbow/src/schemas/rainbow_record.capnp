@0xb3af52db1b3e2cf5;

struct RainbowRecord {
  labelHash @0 :Data;
  label @1 :Text;
}

struct RainbowRecordCollection {
  records @0 :List(RainbowRecord);
} 
