1. Khách hàng spam nút đặt vé liên tục:
    
    Giải pháp: tạo ra 2 lớp rate limit dùng cho hệ thống:
    
    - Disable nút mua tại phía Client
    - Tạo ra 1 idempotency cho mỗi user, lưu key này tại Redis với TTL khoảng 5-10s
2. Webhook thanh toán đến muộn hơn thời gian TTL giữ ghế : khi đặt vé TTL từ 20:00 đến 20:10, đến 20:09, người dùng thanh toán → webhook trả kết quả thanh toán ở 20:12 → how to solve
    
    Kết hợp check chỗ còn trống nếu hết TTL + hoàn tiền.
    
3. 1 tài khoản/1 thiết bị đặt quá nhiều vé để camp → Giới hạn IP hoặc User
4. Không sửa thông tin vé khi đang mở bán vé
5. Vào queue chung (1) khi bấm nút đặt vé hay cho chọn từng hạng vé rồi vào từng queue riêng (2)
    1. TH1: Bấm đặt vé → vào 1 queue chung (Redis Bull Queue): → **CHỌN**
        - Ưu điểm: Bảo vệ cực tốt cho hệ thống, vì dù 10.000 user tràn vào thì vào hết queue, worker lấy ra xử lý tuần tự. 1 Redis Bull Queue duy nhất
        - Nhược điểm: Có khả năng đa số user trong 1 batch chọn cùng hạng vé.
    2. TH2:
        - Ưu điểm: tận dụng đa luồng. Scale độc lập từng hạng vé (seated ít vé → batch nhỏ)
        - Nhược điểm: áp lực lên cache cho đọc ghi số ghế còn lại. Nếu hạng A soldout, user out ra chọn lại hạng B → xếp hàng lại từ đầu → Lý do chính để loại bỏ trường hợp này.
    
    Câu hỏi: Giữa các hạng vé, số lượng người dùng cần mua có chênh lệch nhiều hay không → chưa biết, nên chọn TH1 là an toàn.
    
6. Xác thực BOT camp vé.