insert into reviews (
  business_id,
  customer_name,
  rating,
  review_text,
  suggested_reply,
  status,
  created_at
) values
(
  '11111111-1111-1111-1111-111111111111',
  'Sarah M',
  5,
  'Amazing stay at Hilton Glasgow. Caitlin on reception was brilliant and made everything so easy.',
  'Hi Sarah M, thanks so much for the 5-star review. We really appreciate it and hope to see you again soon.',
  'auto_replied',
  now() - interval '2 hours'
),
(
  '11111111-1111-1111-1111-111111111111',
  'James R',
  4,
  'Lovely hotel and great service from Daniel at breakfast. Room was clean and comfortable.',
  'Hi James R, thanks for your review. We really appreciate the support and hope to welcome you back again soon.',
  'pending',
  now() - interval '5 hours'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Priya K',
  5,
  'Emma was so helpful during check-in. Really friendly team and great location.',
  'Hi Priya K, thank you for the lovely feedback. We are delighted Emma helped make check-in so smooth.',
  'approved',
  now() - interval '1 day'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Mark T',
  2,
  'Room was not ready on time and no one explained what was happening. Disappointing.',
  'Hi Mark T, we are sorry your room was not ready on time. We will review this with the team and improve communication.',
  'pending',
  now() - interval '1 day 3 hours'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Fiona L',
  1,
  'Poor experience overall. Had to wait ages and the issue was not resolved.',
  'Hi Fiona L, we are very sorry to hear this. Please contact us directly so we can understand what happened and put this right.',
  'pending',
  now() - interval '2 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Andrew B',
  5,
  'Sophie and John were both excellent. Really welcoming and professional.',
  'Hi Andrew B, thank you for recognising Sophie and John. We are thrilled they made you feel welcome.',
  'posted',
  now() - interval '3 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Laura C',
  4,
  'Great city centre location and the lobby team were very helpful.',
  'Hi Laura C, thank you for your kind review. We are pleased you enjoyed the location and service.',
  'approved',
  now() - interval '4 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Omar H',
  5,
  'Caitlin handled a late arrival perfectly and made the whole process stress free.',
  'Hi Omar H, thank you for sharing this. Caitlin will be delighted to hear your kind words.',
  'auto_replied',
  now() - interval '5 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Megan S',
  3,
  'Breakfast was nice but the queue was longer than expected.',
  'Hi Megan S, thank you for your feedback. We are glad you enjoyed breakfast and will review queue management.',
  'pending',
  now() - interval '6 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Thomas W',
  5,
  'Daniel was excellent at breakfast and remembered our coffee order.',
  'Hi Thomas W, thank you for the brilliant review. Daniel will really appreciate the recognition.',
  'posted',
  now() - interval '7 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Rachel P',
  4,
  'Clean room, quick check-in and a comfortable bed.',
  'Hi Rachel P, thank you for your review. We are glad you had a comfortable stay.',
  'approved',
  now() - interval '8 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Ben A',
  2,
  'The room temperature was difficult to control and it took too long to get help.',
  'Hi Ben A, we are sorry for the discomfort and delay. We will follow this up with our maintenance and guest teams.',
  'pending',
  now() - interval '9 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Nina G',
  5,
  'Emma gave us fantastic restaurant recommendations nearby.',
  'Hi Nina G, thank you for your lovely feedback. Emma will be so pleased her recommendations helped.',
  'auto_replied',
  now() - interval '10 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Chris D',
  3,
  'Good stay overall but housekeeping arrived earlier than expected.',
  'Hi Chris D, thank you for the helpful feedback. We will review timing with our housekeeping team.',
  'approved',
  now() - interval '12 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Aisha N',
  5,
  'Sophie made our anniversary feel special with a thoughtful room note.',
  'Hi Aisha N, thank you for sharing this. We are delighted Sophie helped make your anniversary memorable.',
  'posted',
  now() - interval '14 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'George F',
  4,
  'Friendly staff and easy parking. Would stay again.',
  'Hi George F, thank you for your kind feedback. We look forward to welcoming you back.',
  'approved',
  now() - interval '16 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Hannah E',
  1,
  'Very noisy overnight and I did not sleep well.',
  'Hi Hannah E, we are very sorry your sleep was disrupted. Please contact us directly so we can review this properly.',
  'pending',
  now() - interval '18 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Iain M',
  5,
  'John sorted our luggage quickly and was genuinely friendly.',
  'Hi Iain M, thank you for recognising John. We are pleased he helped make things easy.',
  'auto_replied',
  now() - interval '19 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Olivia T',
  4,
  'The meeting room was well prepared and the team were attentive.',
  'Hi Olivia T, thank you for your review. We are glad the meeting setup worked well for your team.',
  'posted',
  now() - interval '21 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Khalid J',
  3,
  'Decent stay but the lift wait times were frustrating.',
  'Hi Khalid J, thank you for your feedback. We understand the frustration and will review peak-time lift flow.',
  'pending',
  now() - interval '23 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Maya V',
  5,
  'Caitlin and Emma were both brilliant with our family check-in.',
  'Hi Maya V, thank you for the wonderful review. Caitlin and Emma will be delighted to hear this.',
  'auto_replied',
  now() - interval '24 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Peter Q',
  2,
  'The bathroom needed more attention and the towels arrived late.',
  'Hi Peter Q, we are sorry the room details were not right. We will address this with housekeeping.',
  'pending',
  now() - interval '26 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Sofia R',
  5,
  'Daniel and Sophie made our event run smoothly from start to finish.',
  'Hi Sofia R, thank you for the excellent feedback. Daniel and Sophie will really appreciate your recognition.',
  'posted',
  now() - interval '27 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Liam K',
  4,
  'Comfortable stay with fast check-out and good breakfast options.',
  'Hi Liam K, thank you for your review. We are pleased you enjoyed the stay and breakfast.',
  'approved',
  now() - interval '29 days'
),
(
  '11111111-1111-1111-1111-111111111111',
  'Grace Y',
  5,
  'John helped us find a taxi during a busy evening and saved us a lot of stress.',
  'Hi Grace Y, thank you for sharing this. John will be glad to know he helped make your evening easier.',
  'auto_replied',
  now() - interval '30 days'
);
