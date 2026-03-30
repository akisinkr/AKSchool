-- Seed starter characters for the collection system
-- Mix of rarities so unlocks feel exciting

INSERT INTO characters (id, name, name_ko, rarity, unlock_trigger, description_en, description_ko) VALUES

-- Common (first unlocks)
('f1000000-0000-0000-0000-000000000001', 'Blossom', '블로썸', 'common', '100_points', 'A cheerful cherry blossom sprite who loves counting petals.', '꽃잎 세기를 좋아하는 활기찬 벚꽃 요정'),
('f1000000-0000-0000-0000-000000000002', 'Pixel', '픽셀', 'common', '200_points', 'A tiny grid-loving friend who sees patterns everywhere.', '어디서나 패턴을 발견하는 작은 격자 친구'),
('f1000000-0000-0000-0000-000000000003', 'Mochi', '모찌', 'common', '300_points', 'A soft round buddy who bounces when you get things right.', '정답을 맞추면 통통 튀는 부드러운 둥근 친구'),
('f1000000-0000-0000-0000-000000000004', 'Doodle', '두들', 'common', '400_points', 'An artistic friend who leaves little drawings wherever they go.', '가는 곳마다 작은 그림을 남기는 예술적인 친구'),
('f1000000-0000-0000-0000-000000000005', 'Clover', '클로버', 'common', '500_points', 'A lucky little leaf who brings good vibes to every lesson.', '모든 수업에 행운을 가져다주는 작은 잎사귀'),

-- Uncommon
('f1000000-0000-0000-0000-000000000006', 'Starla', '스탈라', 'uncommon', '600_points', 'A shimmering star who appears when you shine extra bright.', '특별히 빛날 때 나타나는 반짝이는 별'),
('f1000000-0000-0000-0000-000000000007', 'Tango', '탱고', 'uncommon', '700_points', 'A dancing number who turns math into music.', '수학을 음악으로 바꾸는 춤추는 숫자'),
('f1000000-0000-0000-0000-000000000008', 'Coral', '코랄', 'uncommon', '800_points', 'A gentle ocean friend from Sharon''s Singapore memories.', 'Sharon의 싱가포르 추억에서 온 부드러운 바다 친구'),
('f1000000-0000-0000-0000-000000000009', 'Origami', '오리가미', 'uncommon', '900_points', 'A paper crane who unfolds into beautiful shapes.', '아름다운 모양으로 펼쳐지는 종이학'),

-- Rare
('f1000000-0000-0000-0000-000000000010', 'Aurora', '오로라', 'rare', '1000_points', 'A rainbow fox who only appears to dedicated learners.', '열심히 공부하는 학생에게만 나타나는 무지개 여우'),
('f1000000-0000-0000-0000-000000000011', 'Nimbus', '님버스', 'rare', '1500_points', 'A cloud dragon who carries ideas across the sky.', '하늘을 가로질러 아이디어를 나르는 구름 용'),
('f1000000-0000-0000-0000-000000000012', 'Prism', '프리즘', 'rare', '2000_points', 'A crystal cat that splits problems into colorful pieces.', '문제를 화려한 조각으로 나누는 크리스탈 고양이'),

-- Legendary
('f1000000-0000-0000-0000-000000000013', 'Aria Jr.', '아리아 주니어', 'legendary', '2500_points', 'Miss Aria''s magical mini-me — the rarest friend of all.', 'Miss Aria의 마법 미니미 — 가장 희귀한 친구'),
('f1000000-0000-0000-0000-000000000014', 'Galaxy', '갤럭시', 'legendary', '3500_points', 'A universe-sized friend who holds all the knowledge inside.', '모든 지식을 담고 있는 우주만큼 큰 친구');
