export const ROOM_CONFIG_CONTRACT_TITLE = "__ROOM_CONTRACT_CONFIG__";

export interface ContractTemplateConfig {
  innName: string;
  contractTitle: string;
  legalBasis: string[];
  partyAName: string;
  partyACccd: string;
  partyACccdDate: string;
  partyACccdPlace: string;
  partyAAddress: string;
  partyAPhone: string;
  defaultRoomArea: string;
  defaultLeaseMonths: number;
  paymentDueDay: string;
  latePaymentRule: string;
  maintenanceTerms: string[];
  partyAObligations: string[];
  partyBObligations: string[];
  houseRules: string[];
  terminationTerms: string[];
  generalTerms: string[];
  defaultSignatureHeight: number;
}

export interface RentPriceStage {
  id?: string;
  label: string; // VD: "06 tháng đầu", "06 tháng tiếp theo"
  months?: number; // VD: 6
  price: number; // VD: 2800000
  note?: string; // VD: "Giá ưu đãi thời gian đầu" hoặc "Đúng giá chuẩn theo hợp đồng"
}

export interface RoomContractConfig {
  roomArea?: string;
  defaultLeaseMonths?: number;
  defaultDepositAmount?: number;
  roomAddressOverride?: string;
  furnitureDetails?: string[];
  specialTerms?: string[];
  enableStagedPricing?: boolean;
  rentStages?: RentPriceStage[];
}

export function createDefaultRentStages(
  basePrice: number,
  totalMonths = 12,
  firstStageMonths = 6,
  discountedPrice?: number
): RentPriceStage[] {
  const safeBase = Math.max(0, Math.round(basePrice || 0));
  const safeTotal = Math.max(2, Math.round(totalMonths || 12));
  const safeFirst = Math.min(safeTotal - 1, Math.max(1, Math.round(firstStageMonths || 6)));
  const remainingMonths = Math.max(1, safeTotal - safeFirst);
  const firstPrice =
    discountedPrice !== undefined
      ? Math.max(0, Math.round(discountedPrice))
      : Math.max(0, safeBase - 200000);

  return [
    {
      id: "stage-1",
      label: `${String(safeFirst).padStart(2, "0")} tháng đầu`,
      months: safeFirst,
      price: firstPrice,
      note: "Giá ưu đãi thời gian đầu",
    },
    {
      id: "stage-2",
      label: `${String(remainingMonths).padStart(2, "0")} tháng tiếp theo`,
      months: remainingMonths,
      price: safeBase,
      note: "Đúng giá chuẩn theo hợp đồng",
    },
  ];
}

export const CONTRACT_TEMPLATE_VARIABLES: Array<{
  key: string;
  label: string;
  example: string;
}> = [
  { key: "{{TEN_NHA_TRO}}", label: "Tên nhà trọ", example: "Nhà trọ Anh Thư" },
  { key: "{{MA_PHONG}}", label: "Mã / Số phòng", example: "P101" },
  { key: "{{DIEN_TICH}}", label: "Diện tích phòng", example: "32m2" },
  { key: "{{GIA_THUE}}", label: "Giá thuê phòng/tháng", example: "3.200.000 VNĐ" },
  {
    key: "{{LO_TRINH_GIA_THUE}}",
    label: "Lộ trình giá thuê theo giai đoạn",
    example: "06 tháng đầu: 3.000.000 VNĐ/tháng; 06 tháng tiếp theo: 3.200.000 VNĐ/tháng",
  },
  { key: "{{TIEN_COC}}", label: "Số tiền đặt cọc", example: "3.200.000 VNĐ" },
  { key: "{{GIA_DIEN}}", label: "Đơn giá điện", example: "4.000 VNĐ/kWh" },
  { key: "{{GIA_NUOC}}", label: "Đơn giá nước", example: "12.000 VNĐ/m³" },
  { key: "{{TEN_BEN_A}}", label: "Họ tên Bên A (Chủ trọ)", example: "Bùi Thanh Tùng" },
  { key: "{{SDT_BEN_A}}", label: "Số điện thoại Bên A", example: "0901 001 079" },
  { key: "{{TEN_BEN_B}}", label: "Họ tên Bên B (Khách thuê)", example: "Nguyễn Văn An" },
  { key: "{{SDT_BEN_B}}", label: "Số điện thoại Bên B", example: "0901 234 567" },
  { key: "{{THOI_HAN_THUE}}", label: "Thời hạn thuê (tháng)", example: "12 tháng" },
  { key: "{{NGAY_BAT_DAU}}", label: "Ngày bắt đầu thuê", example: "01/09/2026" },
  { key: "{{NGAY_KET_THUC}}", label: "Ngày kết thúc thuê", example: "01/09/2027" },
  { key: "{{NGAY_THANH_TOAN}}", label: "Hạn thanh toán hàng tháng", example: "ngày 05 hàng tháng" },
];

export const DEFAULT_CONTRACT_TEMPLATE: ContractTemplateConfig = {
  innName: "Nhà trọ Anh Thư",
  contractTitle: "HỢP ĐỒNG CHO THUÊ PHÒNG TRỌ",
  legalBasis: [
    "Căn cứ bộ luật dân sự, luật đất đai của nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam.",
    "Căn cứ vào điều kiện và nhu cầu thực tế của các bên trong hợp đồng này.",
  ],
  partyAName: "Bùi Thanh Tùng",
  partyACccd: "086089000009",
  partyACccdDate: "13/08/2021",
  partyACccdPlace: "Cục Cảnh sát QLHC về TTXH",
  partyAAddress:
    "Q5 đường số 6, KDC Cty8, Phường Hưng Thạnh, Quận Cái Răng, Thành phố Cần Thơ, Việt Nam.",
  partyAPhone: "0901 001 079",
  defaultRoomArea: "32m2",
  defaultLeaseMonths: 12,
  paymentDueDay: "ngày 05 hàng tháng",
  latePaymentRule:
    "Bên B sẽ thanh toán tiền thuê phòng cho bên A vào {{NGAY_THANH_TOAN}} cùng với tiền điện và tiền nước. Nếu quá hạn trễ 3 ngày so với thời gian thanh toán và để tình trạng thanh toán trễ quá 3 lần, Bên A có quyền đơn phương chấm dứt hợp đồng và lấy lại phòng (trường hợp xấu nhất buộc phải cắt ổ khoá và không phải chịu trách nhiệm về tài sản trong phòng), Bên B không được quyền khiếu nại và mất 100% số tiền đã cọc.",
  maintenanceTerms: [
    "Với phòng có trang bị máy lạnh, Bên A chịu trách nhiệm bảo trì và định kỳ vệ sinh miễn phí thời gian 06 (Sáu) tháng/ 1 lần. Nếu bên B có phát sinh vệ sinh máy ngoài lịch định kỳ, Bên A sẽ hỗ trợ gọi thợ máy, chi phí do bên B chi trả.",
    "Khi có sự cố nghẹt cống, tắc cống, tràn cống xảy ra: nếu nguyên nhân do Bên B thì Bên B phải thanh toán cho Bên A chi phí sửa chữa và chi phí sẽ được thông báo cụ thể khi sửa chữa.",
  ],
  partyAObligations: [
    "Cung cấp phòng trọ và nội thất trong tình trạng tốt.",
    "Không tự ý tăng giá thuê khi hợp đồng còn hiệu lực.",
    "Nhận tiền thuê đúng thời hạn.",
  ],
  partyBObligations: [
    "Thanh toán đầy đủ tiền theo đúng thỏa thuận.",
    "Sử dụng phòng trọ đúng mục đích, không cho thuê lại trừ khi có sự đồng ý của bên A.",
    "Bảo quản các trang thiết bị và cơ sở vật chất của Bên A trang bị cho ban đầu (làm hỏng phải sửa, mất phải đền).",
    "Đảm bảo các thiết bị và sửa chữa các hư hỏng trong phòng trong khi sử dụng. Nếu không sửa chữa thì khi trả phòng, Bên A sẽ trừ vào tiền đặt cọc, giá trị cụ thể được tính theo giá thị trường.",
    "Nếu có nhu cầu sửa chữa, cải tạo kiến trúc phòng hoặc trang trí ảnh hưởng tới tường, cột, nền phải trao đổi với Bên A để được thống nhất.",
    "Luôn có ý thức giữ gìn vệ sinh trong và ngoài khu vực phòng trọ.",
    "Bên B phải chấp hành mọi quy định của pháp luật Nhà nước, quy định của địa phương và quy định thuê phòng ở Điều 3 của Hợp đồng.",
  ],
  houseRules: [
    "Cấm tổ chức ăn nhậu, tụ tập tham gia các hoạt động cờ bạc, cho vay, đánh bài, số đề, đánh nhau, mua bán, tàng trữ và sử dụng trái phép các chất ma túy.",
    "Bên B không được tiếp khách quá 23h. Trường hợp tự ý cho người ở lại qua đêm nếu Công an kiểm tra thì Bên B sẽ phải tự chịu trách nhiệm (nếu bị phạt).",
    "Bên B phải tôn trọng giờ nghỉ trưa, đặc biệt là sau 23h không được tổ chức tiệc tùng tại nhà trọ gây mất an ninh trật tự, ảnh hưởng những người thuê còn lại.",
    "Xe ra vào chú ý giờ giấc, tránh rồ ga, nẹt pô. Không được gây hấn, nói tục chửi thề hoặc có thái độ không hợp tác với nhân viên quản lý.",
    "Không được vứt rác, xả nước, quăng đồ vật bừa bãi ngoài hành lang và sân trước phòng, giữ vệ sinh chung, rác thải phải để tập trung đúng nơi quy định.",
    "Bảo quản, giữ gìn và không thay đổi, xê dịch tài sản của phòng ở.",
    "Không được khoan tường, không dán tường bằng vật liệu xốp dính, keo dính.",
    "Bên B vi phạm ANTT khu vực (đánh nhau, tụ tập ăn nhậu,.....) và các hành vi vi phạm pháp luật (tàng trữ chất cấm, sử dụng ma túy, mại dâm,.....) có thông báo điều tra hoặc quyết định không cho lưu trú - tạm trú của Cơ quan chức năng có thẩm quyền.",
    "Trường hợp Bên B liên quan những khoản vay không thể chi trả từ tổ chức - cá nhân cho vay nặng lãi có hành vi đe dọa - bạo lực.",
    "Trường hợp Bên B không chấp hành những nội quy trên Bên A được quyền lấy lại phòng. Bên B phải dọn đi trong thời hạn Bên A yêu cầu và mất 100% số tiền đã cọc.",
  ],
  terminationTerms: [
    "Hợp đồng chấm dứt khi hết hạn hoặc do hai bên thỏa thuận.",
    "Trường hợp Bên B chấm dứt hợp đồng trước thời hạn, bên B có quyền chuyển giao/ cho thuê lại cho bên mới thì Bên B sẽ nhận lại được tiền cọc.",
    "Trường hợp Bên B chấm dứt hợp đồng trước thời hạn mà không chuyển giao/cho thuê lại cho bên mới thì Bên B sẽ mất 100 % số tiền cọc và Bên A sẽ nhận lại phòng ở đã cho Bên B thuê. Ngoài ra Bên B phải có trách nhiệm thanh toán các khoản chi phí dịch vụ (điện, nước…) khi Bên B sử dụng phòng ở.",
    "Trong cả 2 trường hợp, Bên B phải báo trước cho Bên A 01 tháng trước khi chấm dứt hợp đồng.",
    "Nếu Bên A đơn phương chấm dứt hợp đồng mà không có lý do chính đáng, phải hoàn lại tiền cọc và bồi thường một khoản tương đương tiền cọc.",
  ],
  generalTerms: [
    "Hợp đồng có hiệu lực kể từ ngày ký.",
    "Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng hoặc theo quy định của pháp luật.",
    "Hợp đồng được lập thành hai bản, mỗi bên giữ một bản có giá trị pháp lý như nhau.",
  ],
  defaultSignatureHeight: 120,
};

/**
 * Thay thế các biến {{KEY}} trong văn bản điều khoản bằng giá trị thực tế của phòng/khách thuê.
 */
export function interpolateContractText(
  text: string,
  vars: Record<string, string | number | undefined>
): string {
  if (!text) return "";
  let result = text;
  for (const [rawKey, val] of Object.entries(vars)) {
    if (val === undefined || val === null) continue;
    const token = rawKey.startsWith("{{") ? rawKey : `{{${rawKey}}}`;
    result = result.split(token).join(String(val));
  }
  return result;
}

/**
 * Chuẩn hóa và hợp nhất dữ liệu cấu hình mẫu hợp đồng với giá trị mặc định.
 */
export function normalizeContractTemplate(
  raw?: Partial<ContractTemplateConfig> | null
): ContractTemplateConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_CONTRACT_TEMPLATE };
  }

  const pickArray = (arr: unknown, fallback: string[]): string[] => {
    if (Array.isArray(arr)) {
      const cleaned = arr
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
      return cleaned.length > 0 ? cleaned : [...fallback];
    }
    return [...fallback];
  };

  return {
    innName:
      typeof raw.innName === "string" && raw.innName.trim()
        ? raw.innName.trim()
        : DEFAULT_CONTRACT_TEMPLATE.innName,
    contractTitle:
      typeof raw.contractTitle === "string" && raw.contractTitle.trim()
        ? raw.contractTitle.trim()
        : DEFAULT_CONTRACT_TEMPLATE.contractTitle,
    legalBasis: pickArray(raw.legalBasis, DEFAULT_CONTRACT_TEMPLATE.legalBasis),
    partyAName:
      typeof raw.partyAName === "string" && raw.partyAName.trim()
        ? raw.partyAName.trim()
        : DEFAULT_CONTRACT_TEMPLATE.partyAName,
    partyACccd:
      typeof raw.partyACccd === "string"
        ? raw.partyACccd.trim()
        : DEFAULT_CONTRACT_TEMPLATE.partyACccd,
    partyACccdDate:
      typeof raw.partyACccdDate === "string"
        ? raw.partyACccdDate.trim()
        : DEFAULT_CONTRACT_TEMPLATE.partyACccdDate,
    partyACccdPlace:
      typeof raw.partyACccdPlace === "string"
        ? raw.partyACccdPlace.trim()
        : DEFAULT_CONTRACT_TEMPLATE.partyACccdPlace,
    partyAAddress:
      typeof raw.partyAAddress === "string"
        ? raw.partyAAddress.trim()
        : DEFAULT_CONTRACT_TEMPLATE.partyAAddress,
    partyAPhone:
      typeof raw.partyAPhone === "string"
        ? raw.partyAPhone.trim()
        : DEFAULT_CONTRACT_TEMPLATE.partyAPhone,
    defaultRoomArea:
      typeof raw.defaultRoomArea === "string" && raw.defaultRoomArea.trim()
        ? raw.defaultRoomArea.trim()
        : DEFAULT_CONTRACT_TEMPLATE.defaultRoomArea,
    defaultLeaseMonths:
      typeof raw.defaultLeaseMonths === "number" && raw.defaultLeaseMonths > 0
        ? Math.round(raw.defaultLeaseMonths)
        : DEFAULT_CONTRACT_TEMPLATE.defaultLeaseMonths,
    paymentDueDay:
      typeof raw.paymentDueDay === "string" && raw.paymentDueDay.trim()
        ? raw.paymentDueDay.trim()
        : DEFAULT_CONTRACT_TEMPLATE.paymentDueDay,
    latePaymentRule:
      typeof raw.latePaymentRule === "string" && raw.latePaymentRule.trim()
        ? raw.latePaymentRule.trim()
        : DEFAULT_CONTRACT_TEMPLATE.latePaymentRule,
    maintenanceTerms: pickArray(
      raw.maintenanceTerms,
      DEFAULT_CONTRACT_TEMPLATE.maintenanceTerms
    ),
    partyAObligations: pickArray(
      raw.partyAObligations,
      DEFAULT_CONTRACT_TEMPLATE.partyAObligations
    ),
    partyBObligations: pickArray(
      raw.partyBObligations,
      DEFAULT_CONTRACT_TEMPLATE.partyBObligations
    ),
    houseRules: pickArray(raw.houseRules, DEFAULT_CONTRACT_TEMPLATE.houseRules),
    terminationTerms: pickArray(
      raw.terminationTerms,
      DEFAULT_CONTRACT_TEMPLATE.terminationTerms
    ),
    generalTerms: pickArray(
      raw.generalTerms,
      DEFAULT_CONTRACT_TEMPLATE.generalTerms
    ),
    defaultSignatureHeight:
      typeof raw.defaultSignatureHeight === "number" &&
      raw.defaultSignatureHeight >= 40 &&
      raw.defaultSignatureHeight <= 240
        ? Math.round(raw.defaultSignatureHeight)
        : DEFAULT_CONTRACT_TEMPLATE.defaultSignatureHeight,
  };
}
