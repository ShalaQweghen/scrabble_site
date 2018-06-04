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

    ['F', 'H', 'V', 'W', 'Y', 'B', 'C', 'M', 'P', ' '].each do |l|
      2.times { bag << l }
    end

    ['Q','Z','J','X','K'].each do |l|
      bag << l
    end

    transform(bag)
  end

  def self.transform(bag)
    if bag.is_a?(Array)
      transformed_bag = ""

      bag.each do |l|
        transformed_bag += l
      end
    else
      transformed_bag = bag.split('')
    end

    transformed_bag
  end

  def self.complete_rack(amount, bag)
    bag = transform(bag)
    letters = []

    amount.times do
      bag.shuffle!
      letters << bag.pop
    end

    [transform(letters), transform(bag)]
  end

  def self.put_back(bag, letters)
    bag = transform(bag)

    letters.each { |l| bag << l }

    transform(bag)
  end
end