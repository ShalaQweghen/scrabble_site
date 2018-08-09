class Bag
  def self.create_bag()
    bag = []

    12.times { bag << 'E' }
    3.times { bag << 'G' }
    8.times { bag << 'O' }

    ['I', 'A'].each do |l|
      9.times { bag << l }
    end

    ['T', 'R', 'N'].each do |l|
      6.times { bag << l }
    end

    ['D', 'U', 'S', 'L'].each do |l|
      4.times { bag << l }
    end

    ['F', 'H', 'V', 'W', 'Y', 'B', 'C', 'M', 'P', '.'].each do |l|
      2.times { bag << l }
    end

    ['Q','Z','J','X','K'].each do |l|
      bag << l
    end

    bag.join
  end

  def self.complete_rack(amount, bag)
    bag = bag.split("")
    letters = []

    amount.times do
      bag.shuffle!
      letters << bag.pop
    end

    [letters.join, bag.join]
  end

  def self.put_back(bag, letters)
    letters.each do |l|
      l.blank? ? bag << "." : bag << l
    end

    bag
  end
end