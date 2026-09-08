export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  bin: string;
}

export const VIETNAMESE_BANKS: BankInfo[] = [
  { code: "MB", name: "MBBank (Ngân hàng Quân Đội)", shortName: "MBBank", bin: "970422" },
  { code: "VCB", name: "Vietcombank (Ngoại Thương Việt Nam)", shortName: "Vietcombank", bin: "970436" },
  { code: "TCB", name: "Techcombank (Kỹ Thương)", shortName: "Techcombank", bin: "970407" },
  { code: "BIDV", name: "BIDV (Đầu tư & Phát triển VN)", shortName: "BIDV", bin: "970418" },
  { code: "ICB", name: "VietinBank (Công Thương Việt Nam)", shortName: "VietinBank", bin: "970415" },
  { code: "ACB", name: "ACB (Á Châu)", shortName: "ACB", bin: "970416" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)", shortName: "VPBank", bin: "970432" },
  { code: "TPB", name: "TPBank (Tiên Phong)", shortName: "TPBank", bin: "970423" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)", shortName: "Sacombank", bin: "970403" },
  { code: "HDB", name: "HDBank (Phát triển TP.HCM)", shortName: "HDBank", bin: "970437" },
  { code: "VIB", name: "VIB (Quốc Tế)", shortName: "VIB", bin: "970441" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)", shortName: "SHB", bin: "970443" },
  { code: "LPB", name: "LPBank (Lộc Phát Việt Nam)", shortName: "LPBank", bin: "970449" },
  { code: "MSB", name: "MSB (Hàng Hải)", shortName: "MSB", bin: "970426" },
  { code: "OCB", name: "OCB (Phương Đông)", shortName: "OCB", bin: "970448" },
  { code: "VAB", name: "VietABank (Việt Á)", shortName: "VietABank", bin: "970427" },
  { code: "NAB", name: "Nam A Bank (Nam Á)", shortName: "Nam A Bank", bin: "970428" },
  { code: "SEAB", name: "SeABank (Đông Nam Á)", shortName: "SeABank", bin: "970440" },
  { code: "ABB", name: "ABBANK (An Bình)", shortName: "ABBANK", bin: "970425" },
  { code: "BVB", name: "BVBank (Bản Việt)", shortName: "BVBank", bin: "970454" },
  { code: "CAKE", name: "CAKE by VPBank", shortName: "CAKE", bin: "546034" },
  { code: "TIMO", name: "Timo by BVBank", shortName: "Timo", bin: "963388" },
];
